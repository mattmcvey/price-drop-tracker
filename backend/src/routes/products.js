import express from 'express';
import { query } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { checkProductPrice } from '../services/priceChecker.js';
import { addAffiliateLink } from '../services/affiliate.js';

const router = express.Router();

// Get all tracked products for user
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT p.*,
              (SELECT price FROM price_history
               WHERE product_id = p.id
               ORDER BY recorded_at DESC LIMIT 1) as latest_price
       FROM products p
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.userId]
    );

    res.json({ products: result.rows });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Track a new product
router.post('/track', authenticate, async (req, res) => {
  try {
    const { title, url, price, image, store, platform } = req.body;
    const userId = req.user.userId;

    // Check if user is premium
    const userResult = await query(
      'SELECT is_premium FROM users WHERE id = $1',
      [userId]
    );
    const isPremium = userResult.rows[0]?.is_premium;

    // Check product limit for free users
    if (!isPremium) {
      const countResult = await query(
        'SELECT COUNT(*) as count FROM products WHERE user_id = $1',
        [userId]
      );
      const count = parseInt(countResult.rows[0].count);

      if (count >= 3) {
        return res.status(403).json({
          error: 'Free plan limit reached',
          message: 'Upgrade to Pro to track unlimited products'
        });
      }
    }

    // Parse price
    const priceValue = parseFloat(price.replace(/[^0-9.]/g, ''));

    // Check if already tracking
    const existing = await query(
      'SELECT id FROM products WHERE user_id = $1 AND url = $2',
      [userId, url]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Already tracking this product' });
    }

    // Add affiliate link
    const affiliateUrl = addAffiliateLink(url, platform);

    // Insert product
    const result = await query(
      `INSERT INTO products (
        user_id, title, url, store, platform, image_url,
        initial_price, current_price, lowest_price
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [userId, title, affiliateUrl, store, platform, image, priceValue, priceValue, priceValue]
    );

    const product = result.rows[0];

    // Add initial price to history
    await query(
      'INSERT INTO price_history (product_id, price) VALUES ($1, $2)',
      [product.id, priceValue]
    );

    res.status(201).json({ product });
  } catch (error) {
    console.error('Track product error:', error);
    res.status(500).json({ error: 'Failed to track product' });
  }
});

// Stop tracking a product
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await query(
      'DELETE FROM products WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product removed from tracking' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to remove product' });
  }
});

// Get price history for a product
router.get('/:id/history', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Verify ownership
    const productResult = await query(
      'SELECT id FROM products WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Get history
    const result = await query(
      `SELECT price, recorded_at
       FROM price_history
       WHERE product_id = $1
       ORDER BY recorded_at ASC`,
      [id]
    );

    res.json({ history: result.rows });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to fetch price history' });
  }
});

// Manual price check
router.post('/check', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get all user's products
    const result = await query(
      'SELECT * FROM products WHERE user_id = $1',
      [userId]
    );

    const products = result.rows;
    const priceDrops = [];

    // Check each product
    for (const product of products) {
      try {
        const newPrice = await checkProductPrice(product);

        if (newPrice && newPrice < product.current_price) {
          priceDrops.push({
            id: product.id,
            title: product.title,
            url: product.url,
            image: product.image_url,
            oldPrice: `$${product.current_price.toFixed(2)}`,
            newPrice: `$${newPrice.toFixed(2)}`
          });
        }
      } catch (error) {
        console.error(`Failed to check product ${product.id}:`, error.message);
      }
    }

    res.json({
      checked: products.length,
      priceDrops
    });
  } catch (error) {
    console.error('Check prices error:', error);
    res.status(500).json({ error: 'Failed to check prices' });
  }
});

export default router;

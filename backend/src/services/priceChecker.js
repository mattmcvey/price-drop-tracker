import axios from 'axios';
import { load } from 'cheerio';
import { query } from '../config/database.js';
import { sendPriceDropEmail } from './email.js';

// Platform-specific selectors (same as extension content script)
const SELECTORS = {
  amazon: {
    price: '.a-price .a-offscreen, #priceblock_ourprice, #priceblock_dealprice, .a-price-whole'
  },
  ebay: {
    price: '.x-price-primary .ux-textspans, #prcIsum'
  },
  walmart: {
    price: '[itemprop="price"], .price-characteristic'
  },
  target: {
    price: '[data-test="product-price"]'
  },
  bestbuy: {
    price: '.priceView-customer-price span'
  }
};

// Clean price string to number
function cleanPrice(priceStr) {
  if (!priceStr) return null;
  const cleaned = priceStr.replace(/[^0-9.]/g, '');
  const price = parseFloat(cleaned);
  return isNaN(price) ? null : price;
}

// Scrape current price from product page using cheerio
export async function scrapePrice(url, platform) {
  try {
    // Fetch HTML with axios
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 15000,
      maxRedirects: 5
    });

    // Load HTML into cheerio
    const $ = load(response.data);

    // Get selectors for this platform
    const selectors = SELECTORS[platform] || SELECTORS.amazon;

    // Try to find price using selectors
    let priceText = null;
    for (const selector of selectors.price.split(', ')) {
      try {
        const element = $(selector).first();
        if (element.length > 0) {
          priceText = element.text().trim();
          if (priceText) break;
        }
      } catch (error) {
        continue;
      }
    }

    if (!priceText) {
      throw new Error('Could not find price on page');
    }

    return cleanPrice(priceText);
  } catch (error) {
    throw new Error(`Scraping failed: ${error.message}`);
  }
}

// Check single product price
export async function checkProductPrice(product) {
  try {
    console.log(`Checking price for product ${product.id}: ${product.title}`);

    const newPrice = await scrapePrice(product.url, product.platform);

    if (!newPrice) {
      console.log(`No price found for product ${product.id}`);
      return null;
    }

    // Update product if price changed
    if (newPrice !== product.current_price) {
      console.log(`Price changed for product ${product.id}: ${product.current_price} → ${newPrice}`);

      // Update product
      await query(
        `UPDATE products
         SET current_price = $1,
             lowest_price = LEAST(lowest_price, $1),
             last_checked_at = NOW(),
             updated_at = NOW()
         WHERE id = $2`,
        [newPrice, product.id]
      );

      // Add to price history
      await query(
        'INSERT INTO price_history (product_id, price) VALUES ($1, $2)',
        [product.id, newPrice]
      );

      // If price dropped, send alert
      if (newPrice < product.current_price) {
        await handlePriceDrop(product, newPrice);
      }

      return newPrice;
    }

    // Update last checked time even if price didn't change
    await query(
      'UPDATE products SET last_checked_at = NOW() WHERE id = $1',
      [product.id]
    );

    return newPrice;
  } catch (error) {
    console.error(`Error checking product ${product.id}:`, error.message);

    // Update last checked time even on error
    await query(
      'UPDATE products SET last_checked_at = NOW() WHERE id = $1',
      [product.id]
    );

    return null;
  }
}

// Handle price drop - send notifications
async function handlePriceDrop(product, newPrice) {
  try {
    const oldPrice = product.current_price;
    const dropPercent = ((oldPrice - newPrice) / oldPrice) * 100;

    console.log(`Price drop detected: ${product.title} - ${dropPercent.toFixed(1)}% off`);

    // Get user preferences
    const prefResult = await query(
      `SELECT up.*, u.email
       FROM user_preferences up
       JOIN users u ON u.id = up.user_id
       WHERE up.user_id = $1`,
      [product.user_id]
    );

    if (prefResult.rows.length === 0) return;

    const prefs = prefResult.rows[0];

    // Check if drop meets threshold
    if (dropPercent < parseFloat(prefs.notification_threshold)) {
      console.log(`Drop ${dropPercent.toFixed(1)}% below threshold ${prefs.notification_threshold}%`);
      return;
    }

    // Record alert
    await query(
      `INSERT INTO price_alerts (product_id, user_id, old_price, new_price)
       VALUES ($1, $2, $3, $4)`,
      [product.id, product.user_id, oldPrice, newPrice]
    );

    // Send email if enabled
    if (prefs.email_notifications) {
      await sendPriceDropEmail({
        to: prefs.email,
        product: {
          title: product.title,
          url: product.url,
          image: product.image_url,
          oldPrice: oldPrice.toFixed(2),
          newPrice: newPrice.toFixed(2),
          dropPercent: dropPercent.toFixed(1)
        }
      });
    }
  } catch (error) {
    console.error('Error handling price drop:', error);
  }
}

// Check all products that need checking
export async function checkAllPrices() {
  try {
    console.log('Starting batch price check...');

    // Get products that haven't been checked in 6 hours
    const result = await query(
      `SELECT *
       FROM products
       WHERE last_checked_at < NOW() - INTERVAL '6 hours'
       ORDER BY last_checked_at ASC
       LIMIT 100` // Process in batches
    );

    const products = result.rows;
    console.log(`Found ${products.length} products to check`);

    let checked = 0;
    let errors = 0;

    // Check products with delay to avoid rate limiting
    for (const product of products) {
      try {
        await checkProductPrice(product);
        checked++;

        // Delay between requests (2-5 seconds)
        const delay = 2000 + Math.random() * 3000;
        await new Promise(resolve => setTimeout(resolve, delay));
      } catch (error) {
        errors++;
        console.error(`Failed to check product ${product.id}:`, error.message);
      }
    }

    console.log(`Batch check complete: ${checked} checked, ${errors} errors`);

    return { checked, errors };
  } catch (error) {
    console.error('Batch check failed:', error);
    throw error;
  }
}

export default { scrapePrice, checkProductPrice, checkAllPrices };

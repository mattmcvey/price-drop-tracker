import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.js';
import productsRoutes from './routes/products.js';
import webhooksRoutes from './routes/webhooks.js';
import userRoutes from './routes/user.js';

// Import services
import { checkAllPrices } from './services/priceChecker.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

// Webhook routes need raw body
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhooksRoutes);

// Regular JSON parsing for other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/user', userRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'PriceDrop API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      user: '/api/user',
      webhooks: '/api/webhooks'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Schedule cron jobs
console.log('Setting up cron jobs...');

// Check prices every 6 hours
cron.schedule('0 */6 * * *', async () => {
  console.log('Running scheduled price check...');
  try {
    await checkAllPrices();
    console.log('Price check completed');
  } catch (error) {
    console.error('Price check failed:', error);
  }
});

// Cleanup old price history (keep last 90 days) - runs daily at 3 AM
cron.schedule('0 3 * * *', async () => {
  console.log('Running database cleanup...');
  try {
    const { pool } = await import('./config/database.js');
    await pool.query(`
      DELETE FROM price_history
      WHERE recorded_at < NOW() - INTERVAL '90 days'
    `);
    console.log('Database cleanup completed');
  } catch (error) {
    console.error('Database cleanup failed:', error);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 PriceDrop API running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`💰 Ready to track prices!`);
});

export default app;

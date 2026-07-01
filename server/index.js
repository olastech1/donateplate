// ============================================================
// DONATEFATE — Express Server (Stripe + Neon Edition)
// ============================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Route imports
const authRoutes = require('./routes/auth');
const campaignRoutes = require('./routes/campaigns');
const donationRoutes = require('./routes/donations');
const updateRoutes = require('./routes/updates');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/users');
const withdrawalRoutes = require('./routes/withdrawals');
const settingsRoutes = require('./routes/settings');
const commentRoutes = require('./routes/comments');
const rewardRoutes = require('./routes/rewards');
const recurringRoutes = require('./routes/recurring');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:5173',
      'https://donatefate.com',
      'https://www.donatefate.com'
    ];
    // Allow requests with no origin (mobile apps, Postman, webhooks)
    if (!origin || allowedOrigins.some(o => origin.startsWith(o)) || origin.endsWith('.vercel.app') || origin.includes('donatefate')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS: ' + origin));
    }
  },
  credentials: true
}));
app.use(morgan('dev'));

// CRITICAL: Stripe webhooks need the RAW body for signature verification.
// We must apply express.raw() BEFORE express.json() on the webhook route.
app.use('/api/donations/webhook/stripe', express.raw({ type: 'application/json' }));

// JSON parsing for all other routes — 5mb limit to support base64 images
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests. Please try again later.' }
});
app.use('/api/', limiter);

// ============================================================
// ROUTES
// ============================================================
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/updates', updateRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/recurring', recurringRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'DonateFate API is running.',
    stack: 'Stripe + Neon PSQL',
    timestamp: new Date().toISOString()
  });
});

// Temporary debug endpoint — remove after fixing DB issue
app.get('/api/debug-db', async (req, res) => {
  const pool = require('./config/db');
  try {
    const dbUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL || 'NOT SET';
    const host = dbUrl.match(/@([^/]+)\//)?.[1] || 'unknown';
    const result = await pool.query('SELECT COUNT(*) as total FROM campaigns');
    const activeResult = await pool.query("SELECT COUNT(*) as active FROM campaigns WHERE status = 'active'");
    res.json({
      success: true,
      db_host: host,
      using_env: process.env.NEON_DATABASE_URL ? 'NEON_DATABASE_URL' : (process.env.DATABASE_URL ? 'DATABASE_URL' : 'POSTGRES_URL'),
      campaigns_total: result.rows[0].total,
      campaigns_active: activeResult.rows[0].active
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} not found.` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ============================================================
// START SERVER (only in local dev — Vercel handles this automatically)
// ============================================================
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n🍽️  DonateFate API running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
    console.log(`💳 Payment: Stripe Checkout`);
    console.log(`🗄️  Database: Neon PSQL\n`);
  });
}

// Export for Vercel serverless
module.exports = app;

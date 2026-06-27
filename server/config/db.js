// ============================================================
// DATABASE CONNECTION — Neon PostgreSQL
// Neon requires SSL for all connections.
// ============================================================
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false  // Required for Neon's serverless driver
  }
});

// Test connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Neon PSQL connection failed:', err.message);
  } else {
    console.log('✅ Neon PSQL connected at:', res.rows[0].now);
  }
});

module.exports = pool;

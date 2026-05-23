require('dotenv').config();
const pool = require('../config/db');

async function migrate() {
  try {
    console.log('🔄 Running database migration to add ban columns to users...');
    await pool.query(
      `ALTER TABLE users 
       ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE,
       ADD COLUMN IF NOT EXISTS ban_type VARCHAR(20) DEFAULT 'none',
       ADD COLUMN IF NOT EXISTS ban_expires_at TIMESTAMP,
       ADD COLUMN IF NOT EXISTS ban_reason TEXT;`
    );
    console.log('✅ Columns is_banned, ban_type, ban_expires_at, ban_reason added successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();

require('dotenv').config();
const pool = require('../config/db');

async function migrate() {
  try {
    console.log('🔄 Running database migration to add user ban columns...');
    
    // Add columns one by one or in a single statement
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS ban_type VARCHAR(20) DEFAULT 'none',
      ADD COLUMN IF NOT EXISTS ban_expires_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS ban_reason TEXT;
    `);

    // Add constraint if not exists (handling PG error if constraint already exists)
    try {
      await pool.query(`
        ALTER TABLE users 
        ADD CONSTRAINT chk_user_ban_type CHECK (ban_type IN ('none', 'temporary', 'permanent'));
      `);
      console.log('✅ Constraint chk_user_ban_type added.');
    } catch (constraintErr) {
      if (constraintErr.code === '42710') {
        console.log('ℹ️ Constraint chk_user_ban_type already exists.');
      } else {
        throw constraintErr;
      }
    }

    console.log('✅ User ban columns added successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();

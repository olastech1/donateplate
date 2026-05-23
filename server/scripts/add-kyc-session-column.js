require('dotenv').config();
const pool = require('../config/db');

async function migrate() {
  try {
    console.log('🔄 Running database migration to add stripe_kyc_session_id to users...');
    await pool.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_kyc_session_id VARCHAR(255);`
    );
    console.log('✅ Column stripe_kyc_session_id added successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();

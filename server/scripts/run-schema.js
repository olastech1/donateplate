/**
 * Run schema.sql against Neon database
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function runSchema() {
  const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  try {
    console.log('🗄️  Connecting to Neon database...');
    console.log(`📡 Host: ${process.env.DATABASE_URL.split('@')[1]?.split('/')[0]}`);

    console.log('📜 Running schema.sql...\n');
    await pool.query(sql);

    console.log('✅ Schema created successfully!');
    console.log('   Tables: users, platform_settings, campaigns, donations, updates, withdrawals');
    console.log('   Extensions: uuid-ossp, pgcrypto');
    console.log('   Triggers: auto-timestamps, donation aggregation\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Schema error:', err.message);
    // If it's a "already exists" type error, that's often OK
    if (err.message.includes('already exists')) {
      console.log('⚠️  Some objects already exist — this is usually fine for re-runs.');
      process.exit(0);
    }
    process.exit(1);
  }
}

runSchema();

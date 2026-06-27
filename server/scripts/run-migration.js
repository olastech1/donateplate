require('dotenv').config({ path: '../.env' });
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  const filePath = path.join(__dirname, '../../database/migration_v2.sql');
  console.log(`Reading migration file from: ${filePath}`);
  
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log('Connecting to database...');
    
    await pool.query(sql);
    console.log('✅ Migration v2 executed successfully.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    pool.end();
  }
}

runMigration();

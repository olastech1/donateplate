const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server/.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'database/migration_v4.sql'), 'utf8');
    await pool.query(sql);
    console.log('Migration v4 applied successfully!');
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();

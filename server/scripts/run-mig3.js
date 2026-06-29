const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, '../../database/migration_v3.sql'), 'utf8');
    await pool.query(sql);
    console.log('Success!');
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();

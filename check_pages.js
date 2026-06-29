const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server/.env') });
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
async function run() {
  try {
    const res = await pool.query("SELECT setting_key FROM platform_settings WHERE setting_key LIKE 'page_%'");
    console.log(res.rows);
  } catch(e) { console.error(e); } finally { pool.end(); }
}
run();

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server/.env') });
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
async function run() {
  try {
    const res = await pool.query('SELECT id, title, creator_id FROM campaigns');
    console.log(res.rows);
  } catch(e) { console.error(e); } finally { pool.end(); }
}
run();

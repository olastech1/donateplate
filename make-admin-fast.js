const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server/.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const res = await pool.query("UPDATE users SET role = 'admin', email_verified = TRUE WHERE email = 'admin@donateplate.com' RETURNING *");
    console.log('Upgraded user:', res.rows[0].email, 'to', res.rows[0].role);
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();

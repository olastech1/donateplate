const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server/.env') });
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const res = await pool.query(`
      SELECT c.*, u.name AS creator_name, u.avatar_url AS creator_avatar, u.is_banned AS creator_is_banned
      FROM campaigns c
      JOIN users u ON c.creator_id = u.id
      LIMIT 1
    `);
    console.log(res.rows);
  } catch(e) { console.error(e); } finally { pool.end(); }
}
run();

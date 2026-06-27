const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_cF5nAkiCNPK7@ep-holy-term-atud9rt2-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const res = await pool.query('SELECT id, name, email, role FROM users');
    console.log('Users in database:', res.rows);
  } catch(e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

run();

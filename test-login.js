const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_cF5nAkiCNPK7@ep-holy-term-atud9rt2-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const email = 'admin@donatefate.com';
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      console.log('User not found.');
      return;
    }
    const user = result.rows[0];
    console.log('User fetched from DB successfully:', {
      id: user.id,
      email: user.email,
      role: user.role,
      is_banned: user.is_banned,
      email_verified: user.email_verified
    });
  } catch(e) {
    console.error('DB Error:', e);
  } finally {
    await pool.end();
  }
}

run();

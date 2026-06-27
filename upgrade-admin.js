const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_cF5nAkiCNPK7@ep-holy-term-atud9rt2-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const res = await pool.query(`
      UPDATE users 
      SET email_verified = TRUE, role = 'admin' 
      WHERE email = 'admin@donatefate.com'
      RETURNING id, name, email, role, email_verified;
    `);
    
    if (res.rows.length > 0) {
      console.log('Successfully upgraded user:', res.rows[0]);
    } else {
      console.log('User not found!');
    }
  } catch(e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

run();

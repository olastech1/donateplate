const pool = require('./server/config/db');
async function run() {
  const result = await pool.query('SELECT id, email, email_verified, role FROM users');
  console.log(result.rows);
  process.exit(0);
}
run();

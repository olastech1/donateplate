const pool = require('./server/config/db');
async function run() {
  const res = await pool.query("SELECT id, email, role FROM users WHERE email LIKE '%admin%'");
  console.log(res.rows);
  process.exit(0);
}
run();

const pool = require('./server/config/db');
async function run() {
  const res = await pool.query("SELECT * FROM users WHERE email = 'hi@olaniyi.me' OR email = 'admin@donateplate.com'");
  console.log(res.rows);
  process.exit(0);
}
run();

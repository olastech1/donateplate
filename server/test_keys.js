require('dotenv').config();
const pool = require('./config/db');

async function test() {
  const res = await pool.query("SELECT setting_key, CASE WHEN is_encrypted THEN 'ENCRYPTED' ELSE setting_value END as val FROM platform_settings WHERE setting_key LIKE 'stripe_%'");
  console.log(res.rows);
  process.exit(0);
}
test();

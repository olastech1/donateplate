require('dotenv').config();
const pool = require('./config/db');

async function checkSettings() {
  try {
    const res = await pool.query("SELECT * FROM platform_settings");
    console.log(res.rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkSettings();

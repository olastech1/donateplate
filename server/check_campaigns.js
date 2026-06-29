require('dotenv').config();
const pool = require('./config/db');

async function checkCampaigns() {
  try {
    const res = await pool.query("SELECT * FROM campaigns");
    console.log(JSON.stringify(res.rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkCampaigns();

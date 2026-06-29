require('dotenv').config();
const pool = require('./config/db');

async function migrate() {
  try {
    await pool.query('ALTER TABLE donations ADD COLUMN IF NOT EXISTS comment TEXT');
    console.log("Added comment column");
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
migrate();

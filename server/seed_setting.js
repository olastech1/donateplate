require('dotenv').config();
const pool = require('./config/db');

async function seed() {
  try {
    await pool.query(`
      INSERT INTO platform_settings (setting_key, setting_value, is_encrypted, description)
      VALUES ('require_email_verification', 'true', FALSE, 'Require users to verify their email before logging in')
      ON CONFLICT (setting_key) DO NOTHING;
    `);
    console.log("Seeded successfully");
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
seed();

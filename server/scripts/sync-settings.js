require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const defaultSettings = [
  { key: 'platform_name', val: 'DonatePlate', is_enc: false, desc: 'Display name of the platform' },
  { key: 'support_email', val: 'support@donateplate.com', is_enc: false, desc: 'Platform support email' },
  { key: 'smtp_host', val: 'smtp.gmail.com', is_enc: false, desc: 'SMTP Host (e.g., smtp.gmail.com)' },
  { key: 'smtp_port', val: '587', is_enc: false, desc: 'SMTP Port (usually 587 or 465)' },
  { key: 'smtp_user', val: '', is_enc: false, desc: 'SMTP Username / Email Address' },
  { key: 'smtp_pass', val: '', is_enc: true, desc: 'SMTP Password or App Password' },
  { key: 'smtp_from', val: 'DonatePlate <noreply@donateplate.com>', is_enc: false, desc: 'Sender Name and Email' },
];

async function syncSettings() {
  try {
    for (const s of defaultSettings) {
      if (s.key === 'platform_name' || s.key === 'support_email') {
        // Just update existing misspellings if they haven't been changed significantly
        await pool.query(`UPDATE platform_settings SET setting_value = $1 WHERE setting_key = $2 AND setting_value ILIKE '%Donate Fate%'`, [s.val, s.key]);
      } else {
        await pool.query(`
          INSERT INTO platform_settings (setting_key, setting_value, is_encrypted, description)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (setting_key) DO NOTHING
        `, [s.key, s.val, s.is_enc, s.desc]);
      }
    }
    console.log('Settings synced successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error syncing settings:', err);
    process.exit(1);
  }
}

syncSettings();

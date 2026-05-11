require('dotenv').config();
const pool = require('./config/db');

async function migrateSmtpSettings() {
  try {
    const settings = [
      { key: 'smtp_host', value: 'smtp.gmail.com', encrypted: false, desc: 'SMTP Host (e.g., smtp.gmail.com)' },
      { key: 'smtp_port', value: '587', encrypted: false, desc: 'SMTP Port (usually 587 or 465)' },
      { key: 'smtp_user', value: '', encrypted: false, desc: 'SMTP Username / Email Address' },
      { key: 'smtp_pass', value: '', encrypted: true, desc: 'SMTP Password or App Password' },
      { key: 'smtp_from', value: '"Donate Plea" <noreply@donateplea.com>', encrypted: false, desc: 'Sender Name and Email' },
    ];

    for (const s of settings) {
      if (s.encrypted) {
        await pool.query(
          `INSERT INTO platform_settings (setting_key, setting_value, is_encrypted, description)
           VALUES ($1, pgp_sym_encrypt($2, $3), $4, $5)
           ON CONFLICT (setting_key) DO NOTHING`,
          [s.key, s.value, process.env.SETTINGS_ENCRYPTION_KEY, s.encrypted, s.desc]
        );
      } else {
        await pool.query(
          `INSERT INTO platform_settings (setting_key, setting_value, is_encrypted, description)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (setting_key) DO NOTHING`,
          [s.key, s.value, s.encrypted, s.desc]
        );
      }
    }
    
    console.log('✅ SMTP Settings injected into database successfully.');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    process.exit();
  }
}

migrateSmtpSettings();

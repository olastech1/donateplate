const path = require('path');
require('dotenv').config();
const pool = require('../config/db');
const settings = require('../config/settings');

async function testKeys() {
  try {
    console.log('Using database:', process.env.DATABASE_URL ? process.env.DATABASE_URL.split('@')[1] : 'undefined');
    console.log('Using encryption key:', process.env.SETTINGS_ENCRYPTION_KEY ? 'Present' : 'Missing');

    // Query platform_settings
    const rows = await pool.query('SELECT setting_key, is_encrypted, length(setting_value) as val_len FROM platform_settings');
    console.log('\n--- DB Settings Row List ---');
    for (const r of rows.rows) {
      console.log(`Key: ${r.setting_key}, Encrypted: ${r.is_encrypted}, Value Length: ${r.val_len}`);
    }

    console.log('\n--- Decrypting Stripe Settings ---');
    const secretKey = await settings.getStripeSecretKey();
    const publicKey = await settings.getStripePublicKey();
    const webhookSecret = await settings.getStripeWebhookSecret();

    console.log('Stripe Secret Key is placeholder:', secretKey ? secretKey.includes('REPLACE_ME') : 'null');
    console.log('Stripe Secret Key length:', secretKey ? secretKey.length : 0);
    console.log('Stripe Public Key is placeholder:', publicKey ? publicKey.includes('REPLACE_ME') : 'null');
    console.log('Stripe Public Key length:', publicKey ? publicKey.length : 0);
    console.log('Stripe Webhook Secret is placeholder:', webhookSecret ? webhookSecret.includes('REPLACE_ME') : 'null');
    console.log('Stripe Webhook Secret length:', webhookSecret ? webhookSecret.length : 0);

  } catch (error) {
    console.error('Error testing DB keys:', error);
  } finally {
    await pool.end();
  }
}

testKeys();

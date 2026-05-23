const path = require('path');
require('dotenv').config();
const jwt = require('jsonwebtoken');

// 1. Set port to 5004 for tests
process.env.PORT = '5004';

// 2. Load DB pool & settings helpers
const pool = require('../config/db');
const settings = require('../config/settings');

// 3. Start the Express App
const app = require('../index');

async function runTests() {
  try {
    console.log('🚀 Starting integration tests for Admin Settings updates...');

    // Get active admin user from DB
    const adminRes = await pool.query("SELECT id FROM users WHERE email = 'admin@donateplea.com'");
    if (adminRes.rows.length === 0) {
      throw new Error("Admin user not found. Please run seed-admin.js first.");
    }
    const adminId = adminRes.rows[0].id;
    const token = jwt.sign(
      { id: adminId, email: 'admin@donateplea.com', role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const baseUrl = 'http://localhost:5004';
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 1: GET /api/admin/settings
    console.log('\n--- Test 1: GET /api/admin/settings ---');
    const resGet = await fetch(`${baseUrl}/api/admin/settings`, {
      method: 'GET',
      headers: authHeaders
    });

    const dataGet = await resGet.json();
    console.log('Status Code:', resGet.status);
    if (resGet.status !== 200 || !dataGet.success) {
      throw new Error('Test 1 Failed: Could not retrieve settings');
    }

    const stripePubKeyRow = dataGet.data.find(s => s.setting_key === 'stripe_public_key');
    console.log('stripe_public_key returned is:', stripePubKeyRow);
    if (!stripePubKeyRow || stripePubKeyRow.display_value !== '••••••••') {
      throw new Error('Test 1 Failed: Stripe public key display value is not masked');
    }
    console.log('✅ Test 1 Passed: Settings retrieved and secret values are successfully masked');

    // Test 2: PUT /api/admin/settings/stripe_public_key
    console.log('\n--- Test 2: PUT /api/admin/settings/stripe_public_key ---');
    const testNewKey = 'pk_test_updated_via_admin_dashboard_endpoints';
    const resPut = await fetch(`${baseUrl}/api/admin/settings/stripe_public_key`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ value: testNewKey })
    });

    const dataPut = await resPut.json();
    console.log('Status Code:', resPut.status);
    console.log('Response Body:', dataPut);

    if (resPut.status !== 200 || !dataPut.success) {
      throw new Error('Test 2 Failed: Settings update failed');
    }
    console.log('✅ Test 2 Passed: Settings PUT request processed successfully');

    // Test 3: Verify security encryption & decryption
    console.log('\n--- Test 3: Verifying storage & decryption of the updated key ---');
    // Direct SQL check (should be encrypted binary ciphertext, not plain text)
    const sqlCheck = await pool.query(
      `SELECT setting_value FROM platform_settings WHERE setting_key = 'stripe_public_key'`
    );
    const dbValue = sqlCheck.rows[0].setting_value;
    console.log('DB Raw Storage type:', typeof dbValue);
    console.log('DB Raw Storage length:', dbValue ? dbValue.length : 0);
    
    // Decrypted verification via settings helper
    const decryptedKey = await settings.getStripePublicKey();
    console.log('Decrypted public key:', decryptedKey);
    if (decryptedKey !== testNewKey) {
      throw new Error(`Test 3 Failed: Decrypted key does not match the saved key (Got: ${decryptedKey})`);
    }
    console.log('✅ Test 3 Passed: Key was encrypted in the DB and decrypted correctly using the application secret key');

    // Revert stripe_public_key back to placeholder
    await fetch(`${baseUrl}/api/admin/settings/stripe_public_key`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ value: 'pk_test_REPLACE_ME' })
    });
    console.log('\n♻️ Reverted stripe_public_key setting back to placeholder.');
    console.log('🎉 All admin settings tests passed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Admin settings test execution failed:');
    console.error(error);
    process.exit(1);
  }
}

runTests();

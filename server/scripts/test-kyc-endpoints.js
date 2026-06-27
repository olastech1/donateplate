const path = require('path');
require('dotenv').config();
const jwt = require('jsonwebtoken');

// 1. Mock Stripe module in require cache BEFORE requiring index.js or controllers
const mockStripe = (key) => {
  return {
    identity: {
      verificationSessions: {
        create: async (params) => {
          return {
            id: 'vs_test_session_id_456',
            url: 'https://verify.stripe.com/session/vs_test_session_id_456',
            status: 'requires_input',
            metadata: params.metadata
          };
        },
        retrieve: async (id, options) => {
          return {
            id,
            status: id === 'vs_test_verified' ? 'verified' : 'requires_input',
            metadata: { user_id: 'f356a3cf-12aa-483e-9603-2a6f27a4c248' },
            verified_outputs: id === 'vs_test_verified' ? {
              first_name: 'Jane',
              last_name: 'Doe',
              dob: { year: 1990, month: 5, day: 15 },
              address: {
                line1: '123 Main St',
                city: 'San Francisco',
                state: 'CA',
                postal_code: '94111',
                country: 'US'
              }
            } : null
          };
        }
      }
    }
  };
};

require.cache[require.resolve('stripe')] = {
  id: require.resolve('stripe'),
  filename: require.resolve('stripe'),
  loaded: true,
  exports: mockStripe
};

// 2. Set port to 5002 for tests so we don't conflict with any running instance on 5001
process.env.PORT = '5002';

// 3. Load database pool
const pool = require('../config/db');

// 4. Start the Express App
const app = require('../index');

async function runTests() {
  try {
    console.log('🚀 Starting end-to-end integration tests for Stripe KYC...');

    // Generate JWT token for seeded creator
    const creatorId = 'f356a3cf-12aa-483e-9603-2a6f27a4c248';
    const token = jwt.sign(
      { id: creatorId, email: 'creator@donatefate.com', role: 'creator' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const baseUrl = 'http://localhost:5002';
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // Wait a brief moment for the server to bind (if starting asynchronously)
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 1: Create Stripe KYC Session
    console.log('\n--- Test 1: POST /api/users/kyc/stripe-session ---');
    const resCreate = await fetch(`${baseUrl}/api/users/kyc/stripe-session`, {
      method: 'POST',
      headers: authHeaders
    });

    const dataCreate = await resCreate.json();
    console.log('Status Code:', resCreate.status);
    console.log('Response Body:', dataCreate);

    if (resCreate.status !== 200 || !dataCreate.success || !dataCreate.url) {
      throw new Error('Test 1 Failed: KYC Session creation failed');
    }
    console.log('✅ Test 1 Passed: KYC Session created successfully');

    // Verify KYC status is now 'pending' in the DB
    const dbStatus1 = await pool.query('SELECT kyc_status FROM users WHERE id = $1', [creatorId]);
    console.log('DB KYC Status:', dbStatus1.rows[0].kyc_status);
    if (dbStatus1.rows[0].kyc_status !== 'pending') {
      throw new Error('Test 1 Failed: User kyc_status was not updated to pending');
    }
    console.log('✅ Test 1 DB Verification Passed: User status is pending');

    // Test 2: Sync Verification Session (Successful Case)
    console.log('\n--- Test 2: GET /api/users/kyc/stripe-sync?session_id=vs_test_verified ---');
    const resSync = await fetch(`${baseUrl}/api/users/kyc/stripe-sync?session_id=vs_test_verified`, {
      method: 'GET',
      headers: authHeaders
    });

    const dataSync = await resSync.json();
    console.log('Status Code:', resSync.status);
    console.log('Response Body:', dataSync);

    if (resSync.status !== 200 || !dataSync.success || dataSync.status !== 'verified') {
      throw new Error('Test 2 Failed: Syncing failed');
    }
    console.log('✅ Test 2 Passed: Sync returned success & verified status');

    // Verify user details are fully updated in the DB
    const dbUser = await pool.query(
      'SELECT kyc_status, kyc_full_name, kyc_dob, kyc_address, kyc_document_type FROM users WHERE id = $1',
      [creatorId]
    );
    console.log('DB User Details post-sync:', dbUser.rows[0]);
    const u = dbUser.rows[0];
    if (
      u.kyc_status !== 'verified' ||
      u.kyc_full_name !== 'Jane Doe' ||
      u.kyc_document_type !== 'stripe_identity' ||
      !u.kyc_dob ||
      !u.kyc_address
    ) {
      throw new Error('Test 2 Failed: Database columns did not populate correctly');
    }
    console.log('✅ Test 2 DB Verification Passed: Legal name, DOB, address, status, and document type stored correctly');

    // Test 3: Sync Verification Session (Failed / Needs Input Case)
    console.log('\n--- Test 3: GET /api/users/kyc/stripe-sync?session_id=vs_test_failed ---');
    const resSyncFailed = await fetch(`${baseUrl}/api/users/kyc/stripe-sync?session_id=vs_test_failed`, {
      method: 'GET',
      headers: authHeaders
    });

    const dataSyncFailed = await resSyncFailed.json();
    console.log('Status Code:', resSyncFailed.status);
    console.log('Response Body:', dataSyncFailed);

    if (resSyncFailed.status !== 200 || !dataSyncFailed.success || dataSyncFailed.status !== 'rejected') {
      throw new Error('Test 3 Failed: Syncing rejected session failed');
    }
    console.log('✅ Test 3 Passed: Sync returned status rejected');

    // Verify DB is updated to 'rejected'
    const dbStatus3 = await pool.query('SELECT kyc_status FROM users WHERE id = $1', [creatorId]);
    console.log('DB KYC Status post-rejection:', dbStatus3.rows[0].kyc_status);
    if (dbStatus3.rows[0].kyc_status !== 'rejected') {
      throw new Error('Test 3 Failed: User status was not updated to rejected');
    }
    console.log('✅ Test 3 DB Verification Passed: User status updated to rejected in database');

    // Reset user back to 'not_submitted' for future tests
    await pool.query(
      `UPDATE users 
       SET kyc_status = 'not_submitted',
           kyc_full_name = NULL,
           kyc_dob = NULL,
           kyc_address = NULL,
           kyc_document_type = NULL,
           kyc_document_url = NULL 
       WHERE id = $1`,
      [creatorId]
    );
    console.log('\n♻️ Test user state cleaned up in DB.');
    console.log('🎉 All integration tests passed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Test execution failed:');
    console.error(error);
    process.exit(1);
  }
}

runTests();

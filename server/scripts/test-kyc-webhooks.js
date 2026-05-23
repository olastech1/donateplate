const path = require('path');
require('dotenv').config();

const creatorId = 'f356a3cf-12aa-483e-9603-2a6f27a4c248';
let mockEventPayload = null;

// 1. Mock Stripe module in require cache BEFORE requiring index.js
const mockStripe = (key) => {
  return {
    identity: {
      verificationSessions: {
        retrieve: async (id, options) => {
          return {
            id,
            status: 'verified',
            metadata: { user_id: creatorId },
            verified_outputs: {
              first_name: 'Jane',
              last_name: 'Doe',
              dob: { year: 1990, month: 5, day: 15 },
              address: {
                line1: '123 Webhook Lane',
                city: 'Austin',
                state: 'TX',
                postal_code: '78701',
                country: 'US'
              }
            }
          };
        }
      }
    },
    webhooks: {
      constructEvent: (body, sig, secret) => {
        return mockEventPayload;
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

// 2. Set port to 5003 for tests
process.env.PORT = '5003';

// 3. Load DB pool
const pool = require('../config/db');

// 4. Start the Express App
const app = require('../index');

async function runTests() {
  try {
    console.log('🚀 Starting integration tests for Stripe KYC Webhooks...');

    const baseUrl = 'http://localhost:5003';
    await new Promise(resolve => setTimeout(resolve, 500));

    // Reset user to 'pending' before webhook fires
    await pool.query("UPDATE users SET kyc_status = 'pending' WHERE id = $1", [creatorId]);

    // Test 1: identity.verification_session.verified webhook event
    console.log('\n--- Test 1: Webhook Event - identity.verification_session.verified ---');
    mockEventPayload = {
      type: 'identity.verification_session.verified',
      data: {
        object: {
          id: 'vs_test_webhook_verified',
          metadata: { user_id: creatorId }
        }
      }
    };

    const resVerified = await fetch(`${baseUrl}/api/donations/webhook/stripe`, {
      method: 'POST',
      headers: {
        'stripe-signature': 't=123,v1=mock_signature',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mockEventPayload)
    });

    const dataVerified = await resVerified.json();
    console.log('Status Code:', resVerified.status);
    console.log('Response Body:', dataVerified);

    if (resVerified.status !== 200 || !dataVerified.received) {
      throw new Error('Test 1 Failed: Webhook did not respond successfully');
    }

    // Verify DB user is updated
    const dbUser = await pool.query(
      'SELECT kyc_status, kyc_full_name, kyc_dob, kyc_address, kyc_document_type FROM users WHERE id = $1',
      [creatorId]
    );
    console.log('DB User Details after verified webhook:', dbUser.rows[0]);
    const u = dbUser.rows[0];
    if (
      u.kyc_status !== 'verified' ||
      u.kyc_full_name !== 'Jane Doe' ||
      u.kyc_document_type !== 'stripe_identity' ||
      !u.kyc_dob ||
      !u.kyc_address ||
      !u.kyc_address.includes('Austin')
    ) {
      throw new Error('Test 1 Failed: Webhook did not populate verified KYC columns');
    }
    console.log('✅ Test 1 Passed: identity.verification_session.verified webhook processed successfully');

    // Test 2: identity.verification_session.requires_input webhook event
    console.log('\n--- Test 2: Webhook Event - identity.verification_session.requires_input ---');
    mockEventPayload = {
      type: 'identity.verification_session.requires_input',
      data: {
        object: {
          id: 'vs_test_webhook_failed',
          metadata: { user_id: creatorId }
        }
      }
    };

    const resFailed = await fetch(`${baseUrl}/api/donations/webhook/stripe`, {
      method: 'POST',
      headers: {
        'stripe-signature': 't=123,v1=mock_signature',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mockEventPayload)
    });

    const dataFailed = await resFailed.json();
    console.log('Status Code:', resFailed.status);
    console.log('Response Body:', dataFailed);

    if (resFailed.status !== 200 || !dataFailed.received) {
      throw new Error('Test 2 Failed: Webhook did not respond successfully');
    }

    // Verify DB user is updated to 'rejected'
    const dbStatus = await pool.query('SELECT kyc_status FROM users WHERE id = $1', [creatorId]);
    console.log('DB KYC Status after failed webhook:', dbStatus.rows[0].kyc_status);
    if (dbStatus.rows[0].kyc_status !== 'rejected') {
      throw new Error('Test 2 Failed: Webhook did not reject user status');
    }
    console.log('✅ Test 2 Passed: identity.verification_session.requires_input webhook processed successfully');

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
    console.log('🎉 All webhook integration tests passed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Webhook test execution failed:');
    console.error(error);
    process.exit(1);
  }
}

runTests();

const path = require('path');
require('dotenv').config();
const jwt = require('jsonwebtoken');

// 1. Set port to 5005 for testing
process.env.PORT = '5005';

// 2. Load DB pool
const pool = require('../config/db');

// 3. Start the Express App
const app = require('../index');

async function runTests() {
  try {
    console.log('🚀 Starting integration tests for Admin Add Funds...');

    // Get active admin user
    const adminRes = await pool.query("SELECT id FROM users WHERE email = 'admin@donatefate.com'");
    if (adminRes.rows.length === 0) {
      throw new Error("Admin user not found. Please seed the DB.");
    }
    const adminId = adminRes.rows[0].id;
    const token = jwt.sign(
      { id: adminId, email: 'admin@donatefate.com', role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const baseUrl = 'http://localhost:5005';
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    await new Promise(resolve => setTimeout(resolve, 500));

    // Get a test active campaign to add funds to
    const campaignRes = await pool.query(
      `SELECT id, title, current_amount FROM campaigns WHERE status = 'active' LIMIT 1`
    );
    if (campaignRes.rows.length === 0) {
      throw new Error("No active campaigns found in database to run tests against.");
    }
    const testCampaign = campaignRes.rows[0];
    const initialAmount = parseFloat(testCampaign.current_amount);
    console.log(`Target Campaign: "${testCampaign.title}" (ID: ${testCampaign.id})`);
    console.log(`Initial current_amount: $${initialAmount}`);

    // Call POST /api/admin/campaigns/:id/add-funds
    console.log('\n--- Test 1: POST /api/admin/campaigns/:id/add-funds ---');
    const addAmount = 150.00;
    const resAdd = await fetch(`${baseUrl}/api/admin/campaigns/${testCampaign.id}/add-funds`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ amount: addAmount })
    });

    const dataAdd = await resAdd.json();
    console.log('Status Code:', resAdd.status);
    console.log('Response Body:', dataAdd);

    if (resAdd.status !== 200 || !dataAdd.success) {
      throw new Error('Test 1 Failed: Add funds request failed');
    }
    console.log('✅ Test 1 Passed: Add funds API request completed successfully');

    // Verify current_amount of the campaign updated in the DB
    const verifyCampaign = await pool.query(
      'SELECT current_amount FROM campaigns WHERE id = $1',
      [testCampaign.id]
    );
    const updatedAmount = parseFloat(verifyCampaign.rows[0].current_amount);
    console.log(`Updated current_amount: $${updatedAmount}`);
    if (updatedAmount !== initialAmount + addAmount) {
      throw new Error(`Test 1 Failed: Campaign current_amount did not increment correctly (Expected: ${initialAmount + addAmount}, Got: ${updatedAmount})`);
    }
    console.log('✅ Test 1 DB Verification Passed: Campaign current_amount incremented correctly via DB trigger');

    // Test 2: Verify balance calculations (should fall under available_balance, not pending_balance)
    console.log('\n--- Test 2: Verifying available vs pending balance calculation ---');
    
    // Simulate what getMyCampaigns does:
    const balanceCheck = await pool.query(
      `SELECT 
         COALESCE(d_avail.available_raised, 0) AS available_raised,
         COALESCE(d_pend.pending_raised, 0) AS pending_raised,
         COALESCE(w.total_withdrawn, 0) AS total_withdrawn,
         GREATEST(0, COALESCE(d_avail.available_raised, 0) - COALESCE(w.total_withdrawn, 0)) AS available_balance,
         COALESCE(d_pend.pending_raised, 0) AS pending_balance
       FROM campaigns c
       LEFT JOIN (
         SELECT campaign_id, SUM(amount) AS available_raised
         FROM donations
         WHERE status = 'success'
           AND created_at < (CASE WHEN EXTRACT(DAY FROM NOW()) >= 15 THEN DATE_TRUNC('month', NOW()) ELSE DATE_TRUNC('month', NOW()) - INTERVAL '1 month' END)
         GROUP BY campaign_id
       ) d_avail ON c.id = d_avail.campaign_id
       LEFT JOIN (
         SELECT campaign_id, SUM(amount) AS pending_raised
         FROM donations
         WHERE status = 'success'
           AND created_at >= (CASE WHEN EXTRACT(DAY FROM NOW()) >= 15 THEN DATE_TRUNC('month', NOW()) ELSE DATE_TRUNC('month', NOW()) - INTERVAL '1 month' END)
         GROUP BY campaign_id
       ) d_pend ON c.id = d_pend.campaign_id
       LEFT JOIN (
         SELECT campaign_id, SUM(amount) AS total_withdrawn
         FROM withdrawals
         WHERE status IN ('pending', 'approved', 'processed')
         GROUP BY campaign_id
       ) w ON c.id = w.campaign_id
       WHERE c.id = $1`,
      [testCampaign.id]
    );

    const b = balanceCheck.rows[0];
    console.log('Balance stats for campaign:', b);
    console.log('Available Balance:', b.available_balance);
    console.log('Pending Balance:', b.pending_balance);

    if (parseFloat(b.available_balance) < addAmount) {
      throw new Error(`Test 2 Failed: Added funds did not go to available_balance (Got available: ${b.available_balance})`);
    }
    console.log('✅ Test 2 Passed: Added funds successfully populated available_balance!');

    // Cleanup: Delete the inserted adjustment donation and restore campaigns.current_amount
    await pool.query(
      `DELETE FROM donations WHERE id = $1`,
      [dataAdd.data.id]
    );
    await pool.query(
      `UPDATE campaigns SET current_amount = current_amount - $1 WHERE id = $2`,
      [addAmount, testCampaign.id]
    );
    console.log('\n♻️ Test state cleaned up in DB.');
    console.log('🎉 All admin add-funds tests passed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Admin add-funds test execution failed:');
    console.error(error);
    process.exit(1);
  }
}

runTests();

const path = require('path');
require('dotenv').config();
const jwt = require('jsonwebtoken');

// 1. Set port to 5006 for testing
process.env.PORT = '5006';

// 2. Load DB pool
const pool = require('../config/db');

// 3. Start the Express App
const app = require('../index');

async function runTests() {
  try {
    console.log('🚀 Starting integration tests for Admin Add User Funds...');

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

    const baseUrl = 'http://localhost:5006';
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    await new Promise(resolve => setTimeout(resolve, 500));

    // Get a test creator user (e.g. creator@donatefate.com)
    const creatorId = 'f356a3cf-12aa-483e-9603-2a6f27a4c248';
    const creatorRes = await pool.query('SELECT name, role FROM users WHERE id = $1', [creatorId]);
    if (creatorRes.rows.length === 0) {
      throw new Error("Test creator user f356a3cf-12aa-483e-9603-2a6f27a4c248 not found in DB.");
    }
    const creatorUser = creatorRes.rows[0];
    console.log(`Target Creator: "${creatorUser.name}" (ID: ${creatorId})`);

    // Verify how many active campaigns this creator currently has
    const campCheckBefore = await pool.query(
      "SELECT id, title, current_amount FROM campaigns WHERE creator_id = $1 AND status IN ('active', 'paused')",
      [creatorId]
    );
    console.log(`Creator has ${campCheckBefore.rows.length} active/paused campaigns before test`);

    // Call POST /api/admin/users/:id/add-funds
    console.log('\n--- Test 1: POST /api/admin/users/:id/add-funds ---');
    const addAmount = 250.00;
    const resAdd = await fetch(`${baseUrl}/api/admin/users/${creatorId}/add-funds`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ amount: addAmount })
    });

    const dataAdd = await resAdd.json();
    console.log('Status Code:', resAdd.status);
    console.log('Response Body:', dataAdd);

    if (resAdd.status !== 200 || !dataAdd.success) {
      throw new Error('Test 1 Failed: Add funds to user request failed');
    }
    console.log('✅ Test 1 Passed: Add funds to user API request completed successfully');

    // Verify how many campaigns they have now (if they had 0, they should now have 1)
    const campCheckAfter = await pool.query(
      "SELECT id, title, current_amount FROM campaigns WHERE creator_id = $1 AND status IN ('active', 'paused') ORDER BY created_at DESC",
      [creatorId]
    );
    console.log(`Creator has ${campCheckAfter.rows.length} active/paused campaigns after test`);
    
    if (campCheckBefore.rows.length === 0 && campCheckAfter.rows.length !== 1) {
      throw new Error('Test 1 Failed: System did not automatically create an adjustment campaign for a creator with 0 campaigns');
    }
    
    const targetCampaign = campCheckAfter.rows[0];
    console.log(`Target Campaign used for adjustment: "${targetCampaign.title}" (ID: ${targetCampaign.id}), current_amount: $${targetCampaign.current_amount}`);
    
    // Check database donation entry
    const donationRes = await pool.query(
      `SELECT id, amount, created_at, guest_name FROM donations 
       WHERE campaign_id = $1 AND guest_name = 'Platform Adjustment' 
       ORDER BY created_at DESC LIMIT 1`,
      [targetCampaign.id]
    );
    if (donationRes.rows.length === 0) {
      throw new Error('Test 1 Failed: Could not locate platform adjustment donation record in database');
    }
    const donation = donationRes.rows[0];
    console.log('Located Donation record:', donation);
    
    // Test 2: Verify balance calculation
    console.log('\n--- Test 2: Verifying that funds are immediately available for withdrawal ---');
    const balanceCheck = await pool.query(
      `SELECT 
         COALESCE(d_avail.available_raised, 0) AS available_raised,
         COALESCE(w.total_withdrawn, 0) AS total_withdrawn,
         GREATEST(0, COALESCE(d_avail.available_raised, 0) - COALESCE(w.total_withdrawn, 0)) AS available_balance
       FROM campaigns c
       LEFT JOIN (
         SELECT campaign_id, SUM(amount) AS available_raised
         FROM donations
         WHERE status = 'success'
           AND created_at < (CASE WHEN EXTRACT(DAY FROM NOW()) >= 15 THEN DATE_TRUNC('month', NOW()) ELSE DATE_TRUNC('month', NOW()) - INTERVAL '1 month' END)
         GROUP BY campaign_id
       ) d_avail ON c.id = d_avail.campaign_id
       LEFT JOIN (
         SELECT campaign_id, SUM(amount) AS total_withdrawn
         FROM withdrawals
         WHERE status IN ('pending', 'approved', 'processed')
         GROUP BY campaign_id
       ) w ON c.id = w.campaign_id
       WHERE c.id = $1`,
      [targetCampaign.id]
    );
    const balance = parseFloat(balanceCheck.rows[0].available_balance);
    console.log(`Available balance in target campaign: $${balance}`);
    if (balance < addAmount) {
      throw new Error(`Test 2 Failed: Added funds did not populate available_balance (Expected at least: ${addAmount}, Got: ${balance})`);
    }
    console.log('✅ Test 2 Passed: User balance is immediately available for withdrawal');

    // Cleanup: Delete donation and campaigns if they were created during test
    await pool.query('DELETE FROM donations WHERE id = $1', [donation.id]);
    if (campCheckBefore.rows.length === 0) {
      await pool.query('DELETE FROM campaigns WHERE id = $1', [targetCampaign.id]);
      console.log('Deleted auto-created adjustment campaign');
    } else {
      await pool.query('UPDATE campaigns SET current_amount = current_amount - $1 WHERE id = $2', [addAmount, targetCampaign.id]);
      console.log('Deducted adjustment amount from campaign total');
    }
    
    console.log('\n♻️ Test state cleaned up in DB.');
    console.log('🎉 All admin add-user-funds tests passed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Admin add-user-funds test execution failed:');
    console.error(error);
    process.exit(1);
  }
}

runTests();

const pool = require('../config/db');
const { getStripeSecretKey } = require('../config/settings');

// Update KYC status
const submitKyc = async (req, res) => {
  try {
    const { id } = req.user;
    const { full_name, dob, address, document_type, document_url } = req.body;
    
    if (!document_url) {
      return res.status(400).json({ success: false, message: 'Document upload is required.' });
    }

    // Check if the document is a valid Base64 image/pdf string
    const isValidFormat = /^data:(image\/jpeg|image\/png|image\/jpg|application\/pdf);base64,/.test(document_url);
    if (!isValidFormat) {
      return res.status(400).json({ success: false, message: 'Invalid document format. Please upload a valid JPG, PNG, or PDF file.' });
    }

    // Check if the file is too small (e.g., less than ~5KB) which indicates a fake or corrupted file
    if (document_url.length < 5000) {
      return res.status(400).json({ success: false, message: 'The uploaded document is invalid or unreadable. Please upload a clear photo or PDF.' });
    }

    // Document is valid format. Set to pending for manual admin review.
    let newStatus = 'pending';
    let message = 'KYC document submitted successfully. Awaiting admin review.';
    
    const result = await pool.query(
      `UPDATE users 
       SET kyc_status = $1, 
           kyc_full_name = $2, 
           kyc_dob = $3, 
           kyc_address = $4, 
           kyc_document_type = $5, 
           kyc_document_url = $6,
           updated_at = NOW()
       WHERE id = $7 RETURNING id, name, email, role, kyc_status`,
      [newStatus, full_name, dob, address, document_type, document_url, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    
    res.json({
      success: true,
      message,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Submit KYC error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getMe = async (req, res) => {
  try {
    const { id } = req.user;
    const result = await pool.query(
      `SELECT id, name, email, role, kyc_status, avatar_url, created_at FROM users WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
}


const createStripeConnectAccount = async (req, res) => {
  try {
    const { id: userId } = req.user;
    
    const dbUser = await pool.query('SELECT stripe_account_id, email FROM users WHERE id = $1', [userId]);
    if (dbUser.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found.' });
    
    let stripeAccountId = dbUser.rows[0].stripe_account_id;
    const stripeSecretKey = await getStripeSecretKey();
    const stripe = require('stripe')(stripeSecretKey);

    // If they don't have a connected account yet, create one
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: dbUser.rows[0].email,
        capabilities: {
          transfers: { requested: true }
        }
      });
      stripeAccountId = account.id;
      
      await pool.query('UPDATE users SET stripe_account_id = $1 WHERE id = $2', [stripeAccountId, userId]);
    }

    const frontendUrl = req.headers.origin || process.env.FRONTEND_URL || 'http://localhost:3000';
    
    // Create an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${frontendUrl}/dashboard?tab=withdraw&stripe=refresh`,
      return_url: `${frontendUrl}/dashboard?tab=withdraw&stripe=return`,
      type: 'account_onboarding',
    });

    res.json({ success: true, url: accountLink.url });
  } catch (err) {
    console.error('Stripe Connect error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to connect Stripe account.' });
  }
};

const getStripeConnectStatus = async (req, res) => {
  try {
    const { id: userId } = req.user;
    
    const dbUser = await pool.query('SELECT stripe_account_id FROM users WHERE id = $1', [userId]);
    const stripeAccountId = dbUser.rows[0]?.stripe_account_id;
    
    if (!stripeAccountId) {
      return res.json({ success: true, connected: false });
    }

    const stripeSecretKey = await getStripeSecretKey();
    const stripe = require('stripe')(stripeSecretKey);

    const account = await stripe.accounts.retrieve(stripeAccountId);
    
    res.json({
      success: true,
      connected: true,
      details_submitted: account.details_submitted,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
    });
  } catch (err) {
    console.error('Get Stripe Status error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve Stripe connection status.' });
  }
};

module.exports = { submitKyc, getMe, createStripeConnectAccount, getStripeConnectStatus };

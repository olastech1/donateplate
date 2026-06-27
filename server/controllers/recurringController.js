// ============================================================
// RECURRING CONTROLLER — Recurring Donations / Subscriptions
// ============================================================
const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * POST /api/recurring
 * Auth required — create a recurring donation subscription.
 */
exports.createSubscription = async (req, res) => {
  try {
    const { campaign_id, amount, frequency } = req.body;

    if (!campaign_id) {
      return res.status(400).json({ success: false, message: 'Campaign ID is required.' });
    }
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than 0.' });
    }
    if (frequency && !['weekly', 'monthly'].includes(frequency)) {
      return res.status(400).json({ success: false, message: 'Frequency must be weekly or monthly.' });
    }

    // Verify campaign exists and is active
    const campaignCheck = await pool.query(
      'SELECT id, status FROM campaigns WHERE id = $1',
      [campaign_id]
    );
    if (campaignCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' });
    }
    if (campaignCheck.rows[0].status !== 'active') {
      return res.status(400).json({ success: false, message: 'Campaign is not currently accepting donations.' });
    }

    // Check if user already has an active subscription for this campaign
    const existingCheck = await pool.query(
      `SELECT id FROM recurring_donations
       WHERE user_id = $1 AND campaign_id = $2 AND status = 'active'`,
      [req.user.id, campaign_id]
    );
    if (existingCheck.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'You already have an active subscription for this campaign.' });
    }

    // Calculate next charge date
    const freq = frequency || 'monthly';
    const nextCharge = new Date();
    if (freq === 'monthly') {
      nextCharge.setMonth(nextCharge.getMonth() + 1);
    } else {
      nextCharge.setDate(nextCharge.getDate() + 7);
    }

    // Create placeholder subscription ID (in production, this would come from Stripe)
    const placeholderSubId = `sub_${uuidv4().replace(/-/g, '').substring(0, 24)}`;

    const result = await pool.query(
      `INSERT INTO recurring_donations (campaign_id, user_id, amount, frequency, stripe_subscription_id, status, next_charge_date)
       VALUES ($1, $2, $3, $4, $5, 'active', $6)
       RETURNING *`,
      [campaign_id, req.user.id, amount, freq, placeholderSubId, nextCharge]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('createSubscription error:', err);
    res.status(500).json({ success: false, message: 'Failed to create subscription.' });
  }
};

/**
 * PUT /api/recurring/:subscriptionId/cancel
 * Auth required — cancel own subscription.
 */
exports.cancelSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    const subCheck = await pool.query(
      'SELECT * FROM recurring_donations WHERE id = $1',
      [subscriptionId]
    );
    if (subCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Subscription not found.' });
    }
    if (subCheck.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You can only cancel your own subscriptions.' });
    }
    if (subCheck.rows[0].status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Subscription is already cancelled.' });
    }

    const result = await pool.query(
      `UPDATE recurring_donations
       SET status = 'cancelled', cancelled_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [subscriptionId]
    );

    res.json({ success: true, data: result.rows[0], message: 'Subscription cancelled.' });
  } catch (err) {
    console.error('cancelSubscription error:', err);
    res.status(500).json({ success: false, message: 'Failed to cancel subscription.' });
  }
};

/**
 * GET /api/recurring/me
 * Auth required — list all user's recurring donations.
 */
exports.getMySubscriptions = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT rd.*, c.title AS campaign_title, c.cover_image_url AS campaign_image, c.status AS campaign_status
       FROM recurring_donations rd
       JOIN campaigns c ON rd.campaign_id = c.id
       WHERE rd.user_id = $1
       ORDER BY rd.created_at DESC`,
      [req.user.id]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('getMySubscriptions error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch subscriptions.' });
  }
};

/**
 * GET /api/recurring/campaign/:campaignId
 * Creator only — list recurring donors for own campaign.
 */
exports.getCampaignSubscriptions = async (req, res) => {
  try {
    const { campaignId } = req.params;

    // Verify campaign ownership
    const campaignCheck = await pool.query(
      'SELECT id, creator_id FROM campaigns WHERE id = $1',
      [campaignId]
    );
    if (campaignCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' });
    }
    if (campaignCheck.rows[0].creator_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const result = await pool.query(
      `SELECT rd.*, u.name AS donor_name, u.avatar_url AS donor_avatar
       FROM recurring_donations rd
       JOIN users u ON rd.user_id = u.id
       WHERE rd.campaign_id = $1
       ORDER BY rd.created_at DESC`,
      [campaignId]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('getCampaignSubscriptions error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch campaign subscriptions.' });
  }
};

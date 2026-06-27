// ============================================================
// REWARD CONTROLLER — Campaign Reward Tiers
// ============================================================
const pool = require('../config/db');

/**
 * GET /api/rewards/:campaignId
 * Public — returns all reward tiers for a campaign.
 */
exports.getRewards = async (req, res) => {
  try {
    const { campaignId } = req.params;

    const result = await pool.query(
      `SELECT * FROM reward_tiers
       WHERE campaign_id = $1
       ORDER BY min_amount ASC`,
      [campaignId]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('getRewards error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch reward tiers.' });
  }
};

/**
 * POST /api/rewards/:campaignId
 * Creator only — create a reward tier for own campaign.
 */
exports.createReward = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { title, description, min_amount, max_claims, image_url } = req.body;

    // Verify campaign exists and belongs to this user
    const campaignCheck = await pool.query(
      'SELECT id, creator_id FROM campaigns WHERE id = $1',
      [campaignId]
    );
    if (campaignCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' });
    }
    if (campaignCheck.rows[0].creator_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You can only add rewards to your own campaigns.' });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Reward title is required.' });
    }
    if (!min_amount || min_amount <= 0) {
      return res.status(400).json({ success: false, message: 'Minimum amount must be greater than 0.' });
    }

    const result = await pool.query(
      `INSERT INTO reward_tiers (campaign_id, title, description, min_amount, max_claims, image_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [campaignId, title.trim(), description || null, min_amount, max_claims || null, image_url || null]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('createReward error:', err);
    res.status(500).json({ success: false, message: 'Failed to create reward tier.' });
  }
};

/**
 * PUT /api/rewards/:rewardId
 * Creator only — update own reward tier.
 */
exports.updateReward = async (req, res) => {
  try {
    const { rewardId } = req.params;
    const { title, description, min_amount, max_claims, image_url } = req.body;

    // Verify reward exists and user owns the campaign
    const rewardCheck = await pool.query(
      `SELECT rt.*, c.creator_id
       FROM reward_tiers rt
       JOIN campaigns c ON rt.campaign_id = c.id
       WHERE rt.id = $1`,
      [rewardId]
    );
    if (rewardCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Reward tier not found.' });
    }
    if (rewardCheck.rows[0].creator_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You can only update rewards on your own campaigns.' });
    }

    const result = await pool.query(
      `UPDATE reward_tiers SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        min_amount = COALESCE($3, min_amount),
        max_claims = COALESCE($4, max_claims),
        image_url = COALESCE($5, image_url)
       WHERE id = $6
       RETURNING *`,
      [title, description, min_amount, max_claims, image_url, rewardId]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('updateReward error:', err);
    res.status(500).json({ success: false, message: 'Failed to update reward tier.' });
  }
};

/**
 * DELETE /api/rewards/:rewardId
 * Creator only — delete own reward tier.
 */
exports.deleteReward = async (req, res) => {
  try {
    const { rewardId } = req.params;

    const rewardCheck = await pool.query(
      `SELECT rt.*, c.creator_id
       FROM reward_tiers rt
       JOIN campaigns c ON rt.campaign_id = c.id
       WHERE rt.id = $1`,
      [rewardId]
    );
    if (rewardCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Reward tier not found.' });
    }
    if (rewardCheck.rows[0].creator_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You can only delete rewards on your own campaigns.' });
    }

    await pool.query('DELETE FROM reward_tiers WHERE id = $1', [rewardId]);

    res.json({ success: true, message: 'Reward tier deleted.' });
  } catch (err) {
    console.error('deleteReward error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete reward tier.' });
  }
};

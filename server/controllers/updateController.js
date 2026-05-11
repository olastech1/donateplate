// ============================================================
// UPDATE CONTROLLER — Campaign progress updates
// ============================================================
const pool = require('../config/db');

/** GET /api/updates/:campaignId — Public */
const getCampaignUpdates = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const result = await pool.query(
      'SELECT * FROM updates WHERE campaign_id = $1 ORDER BY created_at DESC',
      [campaignId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get updates error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/** POST /api/updates/:campaignId — Creator only */
const createUpdate = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { title, message, image_url } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Update message is required.' });
    }

    // Verify the creator owns this campaign
    const ownership = await pool.query(
      'SELECT id FROM campaigns WHERE id = $1 AND creator_id = $2',
      [campaignId, req.user.id]
    );
    if (ownership.rows.length === 0 && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You can only post updates to your own campaigns.' });
    }

    const result = await pool.query(
      `INSERT INTO updates (campaign_id, title, message, image_url)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [campaignId, title || null, message, image_url || null]
    );

    res.status(201).json({ success: true, message: 'Update posted.', data: result.rows[0] });
  } catch (err) {
    console.error('Create update error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getCampaignUpdates, createUpdate };

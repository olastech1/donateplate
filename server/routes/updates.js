// ============================================================
// UPDATE ROUTES — Campaign progress updates
// GET  /api/updates/:campaignId  — Get updates for a campaign (public)
// POST /api/updates/:campaignId  — Post an update (creator only)
// ============================================================
const express = require('express');
const router = express.Router();
const updateController = require('../controllers/updateController');
const { authenticate, requireCreator } = require('../middleware/auth');

// Public
router.get('/:campaignId', updateController.getCampaignUpdates);

// Protected (creator only)
router.post('/:campaignId', authenticate, requireCreator, updateController.createUpdate);

module.exports = router;

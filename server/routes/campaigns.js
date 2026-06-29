// ============================================================
// CAMPAIGN ROUTES
// GET    /api/campaigns          — List active campaigns (public)
// GET    /api/campaigns/:id      — Get single campaign (public)
// POST   /api/campaigns          — Create a campaign (creator only)
// PUT    /api/campaigns/:id      — Update own campaign (creator only)
// GET    /api/campaigns/:id/donors — Public donor list
// ============================================================
const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const { authenticate, requireCreator } = require('../middleware/auth');

// Public routes
router.get('/stats/platform', campaignController.getPublicStats);
router.get('/', campaignController.listActiveCampaigns);
router.get('/:id', campaignController.getCampaignById);
router.get('/:id/donors', campaignController.getCampaignDonors);

// Protected routes (creator or admin)
router.get('/me/all', authenticate, requireCreator, campaignController.getMyCampaigns);
router.post('/', authenticate, requireCreator, campaignController.createCampaign);
router.put('/:id', authenticate, requireCreator, campaignController.updateCampaign);
router.delete('/:id', authenticate, requireCreator, campaignController.deleteCampaign);

module.exports = router;

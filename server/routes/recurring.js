// ============================================================
// RECURRING ROUTES — Recurring Donations / Subscriptions
// POST /api/recurring                         — Create subscription (auth)
// GET  /api/recurring/me                      — My subscriptions (auth)
// PUT  /api/recurring/:subscriptionId/cancel  — Cancel subscription (auth)
// GET  /api/recurring/campaign/:campaignId    — Campaign subscribers (creator)
// ============================================================
const express = require('express');
const router = express.Router();
const recurringController = require('../controllers/recurringController');
const { authenticate, requireCreator } = require('../middleware/auth');

// All recurring routes require authentication
router.use(authenticate);

router.post('/', recurringController.createSubscription);
router.get('/me', recurringController.getMySubscriptions);
router.put('/:subscriptionId/cancel', recurringController.cancelSubscription);
router.get('/campaign/:campaignId', requireCreator, recurringController.getCampaignSubscriptions);

module.exports = router;

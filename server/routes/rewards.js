// ============================================================
// REWARD ROUTES — Campaign Reward Tiers
// GET    /api/rewards/:campaignId   — List rewards (public)
// POST   /api/rewards/:campaignId   — Create reward (creator)
// PUT    /api/rewards/:rewardId     — Update reward (creator)
// DELETE /api/rewards/:rewardId     — Delete reward (creator)
// ============================================================
const express = require('express');
const router = express.Router();
const rewardController = require('../controllers/rewardController');
const { authenticate, requireCreator } = require('../middleware/auth');

// Public
router.get('/:campaignId', rewardController.getRewards);

// Protected (creator only)
router.post('/:campaignId', authenticate, requireCreator, rewardController.createReward);
router.put('/:rewardId', authenticate, requireCreator, rewardController.updateReward);
router.delete('/:rewardId', authenticate, requireCreator, rewardController.deleteReward);

module.exports = router;

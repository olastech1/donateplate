// ============================================================
// DONATION ROUTES — Stripe Checkout Edition
// ============================================================
const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donationController');
const { optionalAuth, authenticate } = require('../middleware/auth');

// Guest-friendly: start a Stripe Checkout session
router.post('/initiate', optionalAuth, donationController.initiateDonation);

// Stripe Webhook (raw body handled in index.js, no auth — verified via signature)
router.post('/webhook/stripe', donationController.stripeWebhook);

// Post-payment callback (verify session)
router.get('/callback', donationController.donationCallback);

// Public recent donations
router.get('/recent', donationController.getRecentDonations);

// Guest tracking by Stripe session ID (public)
router.get('/track/:sessionId', donationController.trackDonation);

// Authenticated user's donation history
router.get('/me', authenticate, donationController.getMyDonations);

module.exports = router;

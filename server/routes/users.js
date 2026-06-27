const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

// Public routes (before auth middleware)
router.get('/profile/:userId', userController.getPublicProfile);

// Protected routes
router.use(authenticate);

router.get('/me', userController.getMe);
router.post('/kyc', userController.submitKyc);
router.put('/profile', userController.updateProfile);

// Stripe Connect
router.post('/stripe/connect', userController.createStripeConnectAccount);
router.get('/stripe/status', userController.getStripeConnectStatus);

module.exports = router;

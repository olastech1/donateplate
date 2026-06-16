const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/me', userController.getMe);
router.post('/kyc', userController.submitKyc);

// Stripe Connect
router.post('/stripe/connect', userController.createStripeConnectAccount);
router.get('/stripe/status', userController.getStripeConnectStatus);

module.exports = router;

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/me', userController.getMe);
router.post('/kyc', userController.submitKyc);

module.exports = router;

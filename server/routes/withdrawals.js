const express = require('express');
const router = express.Router();
const withdrawalController = require('../controllers/withdrawalController');
const { authenticate, requireCreator } = require('../middleware/auth');

router.use(authenticate, requireCreator);

router.post('/', withdrawalController.requestWithdrawal);
router.get('/me', withdrawalController.getMyWithdrawals);

module.exports = router;

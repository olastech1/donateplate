const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

// GET public settings (like page contents, non-encrypted keys)
router.get('/public', settingsController.getPublicSettings);

module.exports = router;

// ============================================================
// COMMENT ROUTES — Campaign Comments & Replies
// GET    /api/comments/:campaignId   — List comments (public)
// POST   /api/comments/:campaignId   — Create comment (auth)
// DELETE /api/comments/:commentId    — Delete comment (auth)
// ============================================================
const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { authenticate } = require('../middleware/auth');

// Public
router.get('/:campaignId', commentController.getComments);

// Protected
router.post('/:campaignId', authenticate, commentController.createComment);
router.delete('/:commentId', authenticate, commentController.deleteComment);

module.exports = router;

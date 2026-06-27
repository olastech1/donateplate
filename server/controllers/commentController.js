// ============================================================
// COMMENT CONTROLLER — Campaign Comments & Replies
// ============================================================
const pool = require('../config/db');

/**
 * GET /api/comments/:campaignId
 * Public — returns paginated, threaded comments for a campaign.
 */
exports.getComments = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Get top-level comments (no parent)
    const commentsResult = await pool.query(
      `SELECT c.id, c.campaign_id, c.user_id, c.parent_id, c.content, c.created_at,
              u.name AS author_name, u.avatar_url AS author_avatar, u.role AS author_role
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.campaign_id = $1 AND c.parent_id IS NULL
       ORDER BY c.created_at DESC
       LIMIT $2 OFFSET $3`,
      [campaignId, limit, offset]
    );

    // Get all replies for these comments
    const commentIds = commentsResult.rows.map(c => c.id);
    let replies = [];
    if (commentIds.length > 0) {
      const repliesResult = await pool.query(
        `SELECT c.id, c.campaign_id, c.user_id, c.parent_id, c.content, c.created_at,
                u.name AS author_name, u.avatar_url AS author_avatar, u.role AS author_role
         FROM comments c
         JOIN users u ON c.user_id = u.id
         WHERE c.parent_id = ANY($1)
         ORDER BY c.created_at ASC`,
        [commentIds]
      );
      replies = repliesResult.rows;
    }

    // Nest replies under their parent
    const comments = commentsResult.rows.map(comment => ({
      ...comment,
      replies: replies.filter(r => r.parent_id === comment.id)
    }));

    // Get total count for pagination
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM comments WHERE campaign_id = $1 AND parent_id IS NULL',
      [campaignId]
    );

    res.json({
      success: true,
      data: comments,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
      }
    });
  } catch (err) {
    console.error('getComments error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch comments.' });
  }
};

/**
 * POST /api/comments/:campaignId
 * Auth required — create a comment or reply.
 */
exports.createComment = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { content, parent_id } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content is required.' });
    }

    // Verify campaign exists
    const campaignCheck = await pool.query('SELECT id FROM campaigns WHERE id = $1', [campaignId]);
    if (campaignCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' });
    }

    // If replying, verify parent comment exists and belongs to same campaign
    if (parent_id) {
      const parentCheck = await pool.query(
        'SELECT id, campaign_id FROM comments WHERE id = $1',
        [parent_id]
      );
      if (parentCheck.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Parent comment not found.' });
      }
      if (parentCheck.rows[0].campaign_id !== campaignId) {
        return res.status(400).json({ success: false, message: 'Parent comment does not belong to this campaign.' });
      }
    }

    const result = await pool.query(
      `INSERT INTO comments (campaign_id, user_id, parent_id, content)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [campaignId, req.user.id, parent_id || null, content.trim()]
    );

    // Fetch author info for the response
    const userResult = await pool.query(
      'SELECT name, avatar_url, role FROM users WHERE id = $1',
      [req.user.id]
    );

    const comment = {
      ...result.rows[0],
      author_name: userResult.rows[0].name,
      author_avatar: userResult.rows[0].avatar_url,
      author_role: userResult.rows[0].role,
      replies: []
    };

    res.status(201).json({ success: true, data: comment });
  } catch (err) {
    console.error('createComment error:', err);
    res.status(500).json({ success: false, message: 'Failed to create comment.' });
  }
};

/**
 * DELETE /api/comments/:commentId
 * Auth required — delete own comment or admin can delete any.
 */
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const commentResult = await pool.query('SELECT * FROM comments WHERE id = $1', [commentId]);
    if (commentResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Comment not found.' });
    }

    const comment = commentResult.rows[0];

    // Only allow author or admin to delete
    if (req.user.role !== 'admin' && req.user.id !== comment.user_id) {
      return res.status(403).json({ success: false, message: 'You can only delete your own comments.' });
    }

    await pool.query('DELETE FROM comments WHERE id = $1', [commentId]);

    res.json({ success: true, message: 'Comment deleted.' });
  } catch (err) {
    console.error('deleteComment error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete comment.' });
  }
};

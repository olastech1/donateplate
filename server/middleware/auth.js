// ============================================================
// JWT AUTHENTICATION MIDDLEWARE
// Verifies Bearer tokens on protected routes.
// ============================================================
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

/**
 * Middleware: Require a valid JWT token.
 * Attaches the decoded user payload to req.user
 */
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access denied. No token provided.' 
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Database lookup to verify user exists and is not banned
    const result = await pool.query(
      'SELECT is_banned, ban_type, ban_expires_at, ban_reason FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'User account no longer exists.' });
    }

    const dbUser = result.rows[0];

    if (dbUser.is_banned) {
      // Check if temporary ban has expired
      if (dbUser.ban_type === 'temporary' && dbUser.ban_expires_at && new Date(dbUser.ban_expires_at) < new Date()) {
        // Auto-unban user
        await pool.query(
          `UPDATE users 
           SET is_banned = FALSE, ban_type = 'none', ban_expires_at = NULL, ban_reason = NULL, updated_at = NOW() 
           WHERE id = $1`,
          [decoded.id]
        );
      } else {
        const expiryMsg = dbUser.ban_type === 'temporary' 
          ? ` until ${new Date(dbUser.ban_expires_at).toLocaleString()}` 
          : ' permanently';
        const reasonMsg = dbUser.ban_reason ? ` Reason: ${dbUser.ban_reason}` : '';
        return res.status(403).json({
          success: false,
          isBanned: true,
          message: `Your account has been banned${expiryMsg}.${reasonMsg}`
        });
      }
    }

    req.user = decoded; // { id, email, role }
    next();
  } catch (err) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token.' 
    });
  }
};

/**
 * Middleware: Require admin role.
 * Must be used AFTER authenticate middleware.
 */
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Admin privileges required.' 
    });
  }
  next();
};

/**
 * Middleware: Require creator role.
 * Must be used AFTER authenticate middleware.
 */
const requireCreator = (req, res, next) => {
  if (req.user.role !== 'creator' && req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Creator privileges required.' 
    });
  }
  next();
};

/**
 * Optional authentication: If a token is present, decode it.
 * If not, continue without req.user (for guest-accessible routes).
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      // Token invalid — treat as guest, continue silently
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
};

module.exports = { authenticate, requireAdmin, requireCreator, optionalAuth };

// ============================================================
// JWT AUTHENTICATION MIDDLEWARE
// Verifies Bearer tokens on protected routes.
// ============================================================
const jwt = require('jsonwebtoken');

/**
 * Middleware: Require a valid JWT token.
 * Attaches the decoded user payload to req.user
 */
const authenticate = (req, res, next) => {
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

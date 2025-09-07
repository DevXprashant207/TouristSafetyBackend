const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

/**
 * Middleware to authenticate JWT tokens
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required',
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('JWT verification failed:', err.message);
      return res.status(403).json({
        success: false,
        error: 'Invalid or expired token',
      });
    }

    // Add user info to request object
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    next();
  });
}

module.exports = { authenticateToken };
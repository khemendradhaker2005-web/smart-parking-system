const jwt = require('jsonwebtoken');
const { query } = require('../database/db');

const JWT_SECRET = process.env.JWT_SECRET || 'smart_parking_super_secret_jwt_key_2026';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.warn('[Security Warning] JWT_SECRET is not set in production environment variables! Please configure JWT_SECRET on Render.');
}

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied: No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Verify user still exists in database
    const userRes = await query(
      'SELECT id, full_name, mobile, email, role FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid session: User not found' });
    }

    req.user = userRes.rows[0];
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired session token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${roles.join(', ')}] role(s). Your role is '${req.user.role}'.`
      });
    }

    next();
  };
}

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      mobile: user.mobile,
      email: user.email,
      full_name: user.full_name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

module.exports = {
  authenticateToken,
  requireRole,
  generateToken,
  JWT_SECRET,
};

/**
 * JWT authentication middleware
 * Verifies JWT tokens and protects routes
 */

const jwt = require('jsonwebtoken');
const { getUserById } = require('../db');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('❌ FATAL: JWT_SECRET is not defined in .env');
  process.exit(1);
}

/**
 * Middleware to verify JWT token and attach user to request
 * Usage: Add to protected routes
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      return res.status(403).json({ error: 'Invalid token' });
    }

    // Verify user still exists in database
    const user = getUserById(decoded.userId);
    if (!user) {
      return res.status(403).json({ error: 'User not found' });
    }

    // Attach user info to request
    req.user = {
      id: user.id,
      loginId: user.loginId,
      email: user.email
    };

    next();
  });
}

/**
 * Generate JWT token for user
 * @param {number} userId 
 * @param {string} expiresIn - Optional expiry (default from env)
 * @returns {string} JWT token
 */
function generateToken(userId, expiresIn = null) {
  return jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn: expiresIn || process.env.JWT_EXPIRES_IN || '7d' }
  );
}

/**
 * Generate short-lived OTP verification token
 * @param {string} email 
 * @returns {string} JWT token
 */
function generateOTPToken(email) {
  return jwt.sign(
    { email, type: 'otp-reset' },
    JWT_SECRET,
    { expiresIn: process.env.OTP_JWT_EXPIRES_IN || '10m' }
  );
}

/**
 * Verify OTP token for password reset
 * @param {string} token 
 * @returns {{ valid: boolean, email?: string, error?: string }}
 */
function verifyOTPToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.type !== 'otp-reset') {
      return { valid: false, error: 'Invalid token type' };
    }

    return { valid: true, email: decoded.email };
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return { valid: false, error: 'Token expired' };
    }
    return { valid: false, error: 'Invalid token' };
  }
}

module.exports = {
  authenticateToken,
  generateToken,
  generateOTPToken,
  verifyOTPToken
};

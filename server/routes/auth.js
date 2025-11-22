/**
 * Authentication routes
 * Handles signup, login, password reset flow, and protected user info
 */

const express = require('express');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const {
  getUserByLoginId,
  getUserByEmail,
  createUser,
  updateUserOTP,
  incrementOtpAttempts,
  clearUserOTP,
  updateUserPassword,
  getUserById
} = require('../db');
const {
  validateLoginId,
  validateEmail,
  validatePassword,
  validateOTP,
  sanitize
} = require('../utils/validation');
const {
  generateOTP,
  hashOTP,
  verifyOTP,
  getOTPExpiry,
  isOTPExpired,
  sendOTPEmail,
  MAX_OTP_ATTEMPTS
} = require('../utils/otp');
const {
  authenticateToken,
  generateToken,
  generateOTPToken,
  verifyOTPToken
} = require('../middleware/auth');

const router = express.Router();
const BCRYPT_ROUNDS = 12;

// Rate limiters for security
const signupLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 5,
  message: { error: 'Too many signup attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

const forgotPasswordLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 5,
  message: { error: 'Too many password reset requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

const verifyOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: 'Too many OTP verification attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * POST /api/auth/signup
 * Register a new user
 */
router.post('/signup', signupLimiter, async (req, res) => {
  try {
    const { loginId, email, password } = req.body;

    // Sanitize inputs
    const cleanLoginId = sanitize(loginId);
    const cleanEmail = sanitize(email).toLowerCase();

    // Validate loginId
    const loginIdValidation = validateLoginId(cleanLoginId);
    if (!loginIdValidation.valid) {
      return res.status(400).json({ error: loginIdValidation.error });
    }

    // Validate email
    const emailValidation = validateEmail(cleanEmail);
    if (!emailValidation.valid) {
      return res.status(400).json({ error: emailValidation.error });
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.error });
    }

    // Check if loginId already exists
    const existingLoginId = await getUserByLoginId(cleanLoginId);
    if (existingLoginId) {
      return res.status(400).json({ error: 'LoginId already taken' });
    }

    // Check if email already exists
    const existingEmail = await getUserByEmail(cleanEmail);
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Create user
    const userId = await createUser(cleanLoginId, cleanEmail, passwordHash);

    console.log(`✅ New user registered: ${cleanLoginId} (ID: ${userId})`);

    res.status(200).json({ message: 'Signup successful' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and return JWT
 */
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { loginId, password } = req.body;

    // Sanitize input
    const cleanLoginId = sanitize(loginId);

    // Basic validation
    if (!cleanLoginId || !password) {
      return res.status(401).json({ error: 'Invalid Login Id or Password' });
    }

    // Get user by loginId
    const user = await getUserByLoginId(cleanLoginId);

    // Always show same error message to prevent user enumeration
    if (!user) {
      return res.status(401).json({ error: 'Invalid Login Id or Password' });
    }

    // Verify password (database column is password_hash)
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid Login Id or Password' });
    }

    // Generate JWT token
    const token = generateToken(user.id);

    console.log(`✅ User logged in: ${user.name}`);

    res.status(200).json({
      message: 'Login successful',
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/forgot-password
 * Request OTP for password reset
 */
router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    // Sanitize input
    const cleanEmail = sanitize(email).toLowerCase();

    // Validate email format
    const emailValidation = validateEmail(cleanEmail);
    if (!emailValidation.valid) {
      // Return generic message even for invalid format to prevent enumeration
      return res.status(200).json({
        message: 'If that account exists, an OTP has been sent'
      });
    }

    // Get user by email
    const user = getUserByEmail(cleanEmail);

    // Always return same response whether user exists or not (prevent enumeration)
    if (!user) {
      return res.status(200).json({
        message: 'If that account exists, an OTP has been sent'
      });
    }

    // Check rate limiting per user (prevent spam)
    if (user.lastOtpRequest) {
      const timeSinceLastRequest = Date.now() - user.lastOtpRequest;
      const cooldownMs = 60 * 1000; // 1 minute cooldown between requests
      
      if (timeSinceLastRequest < cooldownMs) {
        return res.status(200).json({
          message: 'If that account exists, an OTP has been sent'
        });
      }
    }

    // Generate OTP
    const otp = generateOTP();
    const otpHash = await hashOTP(otp);
    const otpExpires = getOTPExpiry();

    // Store hashed OTP in database
    updateUserOTP(cleanEmail, otpHash, otpExpires);

    // Send OTP via email (or log to console if SMTP not configured)
    await sendOTPEmail(cleanEmail, otp);

    console.log(`✅ OTP generated for: ${cleanEmail}`);

    res.status(200).json({
      message: 'If that account exists, an OTP has been sent'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/verify-otp
 * Verify OTP and return short-lived token for password reset
 */
router.post('/verify-otp', verifyOtpLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Sanitize inputs
    const cleanEmail = sanitize(email).toLowerCase();
    const cleanOTP = sanitize(otp);

    // Validate email
    const emailValidation = validateEmail(cleanEmail);
    if (!emailValidation.valid) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Validate OTP format
    const otpValidation = validateOTP(cleanOTP);
    if (!otpValidation.valid) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Get user
    const user = getUserByEmail(cleanEmail);
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Check if OTP exists
    if (!user.otpHash || !user.otpExpires) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Check if OTP expired
    if (isOTPExpired(user.otpExpires)) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Check attempt limit
    if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
      return res.status(400).json({
        error: 'Maximum OTP attempts exceeded. Please request a new OTP.'
      });
    }

    // Verify OTP
    const isOTPValid = await verifyOTP(cleanOTP, user.otpHash);
    
    if (!isOTPValid) {
      // Increment attempts
      incrementOtpAttempts(cleanEmail);
      
      const remainingAttempts = MAX_OTP_ATTEMPTS - (user.otpAttempts + 1);
      
      if (remainingAttempts <= 0) {
        return res.status(400).json({
          error: 'Maximum OTP attempts exceeded. Please request a new OTP.'
        });
      }
      
      return res.status(400).json({
        error: `Invalid or expired OTP. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining.`
      });
    }

    // OTP is valid - generate short-lived token for password reset
    const otpToken = generateOTPToken(cleanEmail);

    console.log(`✅ OTP verified for: ${cleanEmail}`);

    res.status(200).json({
      message: 'OTP verified',
      otpToken
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password using OTP token
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otpToken, newPassword } = req.body;

    // Sanitize inputs
    const cleanEmail = sanitize(email).toLowerCase();

    // Validate email
    const emailValidation = validateEmail(cleanEmail);
    if (!emailValidation.valid) {
      return res.status(400).json({ error: emailValidation.error });
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.error });
    }

    // Verify OTP token
    const tokenVerification = verifyOTPToken(otpToken);
    if (!tokenVerification.valid) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Ensure email in token matches provided email
    if (tokenVerification.email !== cleanEmail) {
      return res.status(400).json({ error: 'Invalid reset token' });
    }

    // Get user
    const user = getUserByEmail(cleanEmail);
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    // Update password and clear OTP
    updateUserPassword(cleanEmail, newPasswordHash);
    clearUserOTP(cleanEmail);

    console.log(`✅ Password reset successful for: ${cleanEmail}`);

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/auth/me
 * Get current user info (protected route)
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // User info attached by authenticateToken middleware
    const user = await getUserById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      user: {
        id: user.id,
        loginId: user.loginId,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * TEST ENDPOINT - Get all users (no authentication required)
 * This is for testing database connectivity only
 * Remove in production!
 */
router.get('/test-users', async (req, res) => {
  try {
    const { pool } = require('../db');
    const result = await pool.query('SELECT id, email, name, phone, role, is_active FROM users ORDER BY email');
    
    console.log(`✅ Retrieved ${result.rows.length} users from database`);
    
    res.status(200).json({
      success: true,
      count: result.rows.length,
      users: result.rows
    });
  } catch (error) {
    console.error('Test users endpoint error:', error);
    res.status(500).json({ 
      error: 'Database error',
      details: error.message
    });
  }
});

/**
 * TEST ENDPOINT - Get all database tables
 */
router.get('/test-tables', async (req, res) => {
  try {
    const { pool } = require('../db');
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`✅ Found ${result.rows.length} tables in database`);
    
    res.status(200).json({
      success: true,
      count: result.rows.length,
      tables: result.rows.map(r => r.table_name)
    });
  } catch (error) {
    console.error('Test tables endpoint error:', error);
    res.status(500).json({ 
      error: 'Database error',
      details: error.message
    });
  }
});

/**
 * TEST ENDPOINT - Get column names for a specific table
 */
router.get('/test-columns/:tableName', async (req, res) => {
  try {
    const { pool } = require('../db');
    const { tableName } = req.params;
    
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);
    
    res.status(200).json({
      success: true,
      table: tableName,
      columns: result.rows
    });
  } catch (error) {
    console.error('Test columns error:', error);
    res.status(500).json({ 
      error: 'Database error',
      details: error.message
    });
  }
});

module.exports = router;

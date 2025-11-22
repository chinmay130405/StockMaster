/**
 * OTP generation, verification, and email sending utilities
 * Implements secure OTP handling with hashing and expiry
 */

const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
require('dotenv').config();

const BCRYPT_ROUNDS = 12;
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_OTP_ATTEMPTS = 5;

/**
 * Generate a 6-digit numeric OTP
 * @returns {string} 6-digit OTP
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hash OTP using bcrypt before storing in database
 * @param {string} otp - Plain OTP
 * @returns {Promise<string>} Hashed OTP
 */
async function hashOTP(otp) {
  return await bcrypt.hash(otp, BCRYPT_ROUNDS);
}

/**
 * Verify OTP against stored hash
 * @param {string} plainOTP - User-provided OTP
 * @param {string} hashedOTP - Stored hashed OTP
 * @returns {Promise<boolean>}
 */
async function verifyOTP(plainOTP, hashedOTP) {
  return await bcrypt.compare(plainOTP, hashedOTP);
}

/**
 * Calculate OTP expiry timestamp
 * @returns {number} Expiry timestamp in milliseconds
 */
function getOTPExpiry() {
  return Date.now() + OTP_EXPIRY_MS;
}

/**
 * Check if OTP has expired
 * @param {number} expiryTime - Expiry timestamp
 * @returns {boolean}
 */
function isOTPExpired(expiryTime) {
  return Date.now() > expiryTime;
}

/**
 * Create nodemailer transporter
 * Falls back to console logging if SMTP not configured
 */
function createEmailTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } = process.env;
  
  // Check if SMTP is configured
  if (!SMTP_HOST || !SMTP_USER) {
    console.log('⚠️  SMTP not configured. OTPs will be logged to console only.');
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT) || 587,
    secure: SMTP_SECURE === 'true',
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });
}

/**
 * Send OTP via email or log to console if SMTP not configured
 * @param {string} email - Recipient email
 * @param {string} otp - Plain OTP to send
 * @returns {Promise<void>}
 */
async function sendOTPEmail(email, otp) {
  const transporter = createEmailTransporter();
  
  // If no SMTP configured, log to console for development
  if (!transporter) {
    console.log('\n' + '='.repeat(60));
    console.log('🔐 OTP FOR DEVELOPMENT');
    console.log('='.repeat(60));
    console.log(`Email: ${email}`);
    console.log(`OTP: ${otp}`);
    console.log(`Expires in: 10 minutes`);
    console.log('='.repeat(60) + '\n');
    return;
  }

  // Send actual email
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@stockmaster.com',
    to: email,
    subject: 'StockMaster - Password Reset OTP',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
          .otp-box { background: white; border: 2px dashed #4F46E5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px; }
          .otp { font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4F46E5; }
          .warning { color: #dc2626; font-size: 14px; margin-top: 20px; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>StockMaster Password Reset</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>You requested to reset your password. Please use the following OTP to complete the process:</p>
            
            <div class="otp-box">
              <div class="otp">${otp}</div>
            </div>
            
            <p><strong>This OTP will expire in 10 minutes.</strong></p>
            <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
            
            <div class="warning">
              ⚠️ Never share your OTP with anyone. StockMaster will never ask for your OTP via phone or email.
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} StockMaster. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
StockMaster Password Reset

You requested to reset your password. Please use the following OTP:

${otp}

This OTP will expire in 10 minutes.

If you didn't request this password reset, please ignore this email.

Never share your OTP with anyone.
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent to ${email}`);
  } catch (error) {
    console.error('❌ Error sending OTP email:', error.message);
    // Still log to console as fallback
    console.log(`\n🔐 FALLBACK - OTP for ${email}: ${otp}\n`);
  }
}

module.exports = {
  generateOTP,
  hashOTP,
  verifyOTP,
  getOTPExpiry,
  isOTPExpired,
  sendOTPEmail,
  MAX_OTP_ATTEMPTS,
  OTP_EXPIRY_MS
};

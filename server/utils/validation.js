/**
 * Input validation utilities
 * Enforces strict validation rules for auth inputs
 */

const validator = require('validator');

/**
 * Validate loginId format
 * Rules: 6-12 characters, letters/numbers/underscore only
 * @param {string} loginId 
 * @returns {{ valid: boolean, error?: string }}
 */
function validateLoginId(loginId) {
  if (!loginId || typeof loginId !== 'string') {
    return { valid: false, error: 'LoginId is required' };
  }

  const trimmed = loginId.trim();
  
  if (trimmed.length < 6 || trimmed.length > 12) {
    return { valid: false, error: 'LoginId must be 6-12 characters' };
  }

  // Only letters, numbers, and underscore
  const loginIdRegex = /^[a-zA-Z0-9_]+$/;
  if (!loginIdRegex.test(trimmed)) {
    return { valid: false, error: 'LoginId can only contain letters, numbers, and underscore' };
  }

  return { valid: true };
}

/**
 * Validate email format
 * @param {string} email 
 * @returns {{ valid: boolean, error?: string }}
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  const trimmed = email.trim();
  
  if (!validator.isEmail(trimmed)) {
    return { valid: false, error: 'Invalid email format' };
  }

  return { valid: true };
}

/**
 * Validate password strength
 * Rules: Minimum 9 characters, at least one lowercase, one uppercase, one special character
 * @param {string} password 
 * @returns {{ valid: boolean, error?: string }}
 */
function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < 9) {
    return { valid: false, error: 'Password must be at least 9 characters' };
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }

  // Check for at least one special character
  // Special characters: !@#$%^&*()_+-=[]{}|;:,.<>?
  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character' };
  }

  return { valid: true };
}

/**
 * Validate OTP format
 * @param {string} otp 
 * @returns {{ valid: boolean, error?: string }}
 */
function validateOTP(otp) {
  if (!otp || typeof otp !== 'string') {
    return { valid: false, error: 'OTP is required' };
  }

  const trimmed = otp.trim();
  
  // Must be exactly 6 digits
  if (!/^\d{6}$/.test(trimmed)) {
    return { valid: false, error: 'OTP must be a 6-digit number' };
  }

  return { valid: true };
}

/**
 * Sanitize string input (trim whitespace)
 * @param {string} input 
 * @returns {string}
 */
function sanitize(input) {
  if (typeof input !== 'string') return '';
  return input.trim();
}

module.exports = {
  validateLoginId,
  validateEmail,
  validatePassword,
  validateOTP,
  sanitize
};

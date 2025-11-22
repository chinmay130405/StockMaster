/**
 * Database initialization and helper functions using PostgreSQL
 * Manages PostgreSQL connection pool and queries
 */

const { Pool } = require('pg');
require('dotenv').config();

// Create PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'stockmaster',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});


/**
 * Initialize database schema (tables should already exist from dump restore)
 * This function is kept for compatibility but won't recreate tables
 */
async function initDatabase() {
  try {
    // Test connection
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connection verified:', result.rows[0].now);
    
    // Check if users table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ Users table found in database');
    } else {
      console.warn('⚠️  Users table not found. Database may need to be restored from dump.');
    }
  } catch (err) {
    console.error('❌ Database initialization error:', err);
    throw err;
  }
}

/**
 * Get user by loginId (using 'name' column in DB)
 */
async function getUserByLoginId(loginId) {
  const result = await pool.query(
    'SELECT * FROM users WHERE name = $1',
    [loginId]
  );
  return result.rows[0];
}

/**
 * Get user by email
 */
async function getUserByEmail(email) {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0];
}

/**
 * Create new user
 */
async function createUser(loginId, email, passwordHash) {
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, is_active)
     VALUES ($1, $2, $3, 'staff', true)
     RETURNING id`,
    [loginId, email, passwordHash]
  );
  return result.rows[0].id;
}

/**
 * Update user's OTP information
 */
async function updateUserOTP(email, otpHash, otpExpires) {
  await pool.query(
    `UPDATE users 
     SET otp_hash = $1, otp_expires = $2, otp_attempts = 0, last_otp_request = $3
     WHERE email = $4`,
    [otpHash, new Date(otpExpires), new Date(), email]
  );
}

/**
 * Increment OTP attempts counter
 */
async function incrementOtpAttempts(email) {
  await pool.query(
    `UPDATE users 
     SET otp_attempts = otp_attempts + 1
     WHERE email = $1`,
    [email]
  );
}

/**
 * Clear OTP data after successful verification
 */
async function clearUserOTP(email) {
  await pool.query(
    `UPDATE users 
     SET otp_hash = NULL, otp_expires = NULL, otp_attempts = 0
     WHERE email = $1`,
    [email]
  );
}

/**
 * Update user password
 */
async function updateUserPassword(email, passwordHash) {
  await pool.query(
    `UPDATE users 
     SET password_hash = $1
     WHERE email = $2`,
    [passwordHash, email]
  );
}

/**
 * Get user by ID (for JWT payload verification)
 */
async function getUserById(id) {
  const result = await pool.query(
    'SELECT id, name as "loginId", email FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0];
}

module.exports = {
  pool,
  initDatabase,
  getUserByLoginId,
  getUserByEmail,
  createUser,
  updateUserOTP,
  incrementOtpAttempts,
  clearUserOTP,
  updateUserPassword,
  getUserById
};

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
 * Get user by loginId
 */
async function getUserByLoginId(loginId) {
  const result = await pool.query(
    'SELECT * FROM users WHERE "loginId" = $1',
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
    `INSERT INTO users ("loginId", email, "passwordHash", "createdAt")
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [loginId, email, passwordHash, new Date()]
  );
  return result.rows[0].id;
}

/**
 * Update user's OTP information
 */
async function updateUserOTP(email, otpHash, otpExpires) {
  await pool.query(
    `UPDATE users 
     SET "otpHash" = $1, "otpExpires" = $2, "otpAttempts" = 0, "lastOtpRequest" = $3
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
     SET "otpAttempts" = "otpAttempts" + 1
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
     SET "otpHash" = NULL, "otpExpires" = NULL, "otpAttempts" = 0
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
     SET "passwordHash" = $1
     WHERE email = $2`,
    [passwordHash, email]
  );
}

/**
 * Get user by ID (for JWT payload verification)
 */
async function getUserById(id) {
  const result = await pool.query(
    'SELECT id, "loginId", email, "createdAt" FROM users WHERE id = $1',
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

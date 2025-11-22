/**
 * Database initialization and helper functions
 * SQLite for authentication, PostgreSQL for application data
 */

const Database = require('better-sqlite3');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

// SQLite for authentication
const DB_FILE = process.env.DB_FILE || './database.db';
const authDb = new Database(DB_FILE);
authDb.pragma('journal_mode = WAL');

// PostgreSQL for application data
const pgPool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

// Test PostgreSQL connection
pgPool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database (application data)');
});

pgPool.on('error', (err) => {
  console.error('❌ PostgreSQL error:', err.message);
});

/**
 * Initialize authentication database (SQLite)
 * Creates users table with all required fields for auth and OTP
 */
function initDatabase() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loginId TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      otpHash TEXT,
      otpExpires INTEGER,
      otpAttempts INTEGER DEFAULT 0,
      lastOtpRequest INTEGER
    )
  `;

  authDb.exec(createTableSQL);
  
  // Create indexes for faster lookups
  authDb.exec('CREATE INDEX IF NOT EXISTS idx_loginId ON users(loginId)');
  authDb.exec('CREATE INDEX IF NOT EXISTS idx_email ON users(email)');
  
  console.log('✅ Authentication database (SQLite) initialized');
}

/**
 * Get user by loginId
 */
function getUserByLoginId(loginId) {
  const stmt = authDb.prepare('SELECT * FROM users WHERE loginId = ?');
  return stmt.get(loginId);
}

/**
 * Get user by email
 */
function getUserByEmail(email) {
  const stmt = authDb.prepare('SELECT * FROM users WHERE email = ?');
  return stmt.get(email);
}

/**
 * Create new user
 */
function createUser(loginId, email, passwordHash) {
  const stmt = authDb.prepare(`
    INSERT INTO users (loginId, email, passwordHash, createdAt)
    VALUES (?, ?, ?, ?)
  `);
  
  const result = stmt.run(loginId, email, passwordHash, Date.now());
  return result.lastInsertRowid;
}

/**
 * Update user's OTP information
 */
function updateUserOTP(email, otpHash, otpExpires) {
  const stmt = authDb.prepare(`
    UPDATE users 
    SET otpHash = ?, otpExpires = ?, otpAttempts = 0, lastOtpRequest = ?
    WHERE email = ?
  `);
  
  stmt.run(otpHash, otpExpires, Date.now(), email);
}

/**
 * Increment OTP attempts counter
 */
function incrementOtpAttempts(email) {
  const stmt = authDb.prepare(`
    UPDATE users 
    SET otpAttempts = otpAttempts + 1
    WHERE email = ?
  `);
  
  stmt.run(email);
}

/**
 * Clear OTP data after successful verification
 */
function clearUserOTP(email) {
  const stmt = authDb.prepare(`
    UPDATE users 
    SET otpHash = NULL, otpExpires = NULL, otpAttempts = 0
    WHERE email = ?
  `);
  
  stmt.run(email);
}

/**
 * Update user password
 */
function updateUserPassword(email, passwordHash) {
  const stmt = authDb.prepare(`
    UPDATE users 
    SET passwordHash = ?
    WHERE email = ?
  `);
  
  stmt.run(passwordHash, email);
}

/**
 * Get user by ID (for JWT payload verification)
 */
function getUserById(id) {
  const stmt = authDb.prepare('SELECT id, loginId, email, createdAt FROM users WHERE id = ?');
  return stmt.get(id);
}

module.exports = {
  // SQLite for authentication
  authDb,
  initDatabase,
  getUserByLoginId,
  getUserByEmail,
  createUser,
  updateUserOTP,
  incrementOtpAttempts,
  clearUserOTP,
  updateUserPassword,
  getUserById,
  
  // PostgreSQL for application data
  pgPool
};

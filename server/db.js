/**
 * Database initialization and helper functions using better-sqlite3
 * Manages SQLite connection and schema creation
 */

const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const DB_FILE = process.env.DB_FILE || './database.db';
const db = new Database(DB_FILE);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

/**
 * Initialize database schema
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

  db.exec(createTableSQL);
  
  // Create indexes for faster lookups
  db.exec('CREATE INDEX IF NOT EXISTS idx_loginId ON users(loginId)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_email ON users(email)');
  
  console.log('✅ Database initialized successfully');
}

/**
 * Get user by loginId
 */
function getUserByLoginId(loginId) {
  const stmt = db.prepare('SELECT * FROM users WHERE loginId = ?');
  return stmt.get(loginId);
}

/**
 * Get user by email
 */
function getUserByEmail(email) {
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  return stmt.get(email);
}

/**
 * Create new user
 */
function createUser(loginId, email, passwordHash) {
  const stmt = db.prepare(`
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
  const stmt = db.prepare(`
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
  const stmt = db.prepare(`
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
  const stmt = db.prepare(`
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
  const stmt = db.prepare(`
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
  const stmt = db.prepare('SELECT id, loginId, email, createdAt FROM users WHERE id = ?');
  return stmt.get(id);
}

module.exports = {
  db,
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

/**
 * Data routes for PostgreSQL database
 * Handles fetching application data from PostgreSQL
 */

const express = require('express');
const { pgPool } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/data/tables
 * List all tables in the database
 */
router.get('/tables', authenticateToken, async (req, res) => {
  try {
    const result = await pgPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    res.status(200).json({
      tables: result.rows.map(row => row.table_name)
    });
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

/**
 * GET /api/data/:tableName
 * Fetch all data from a specific table
 */
router.get('/:tableName', authenticateToken, async (req, res) => {
  try {
    const { tableName } = req.params;
    const { limit = 100, offset = 0 } = req.query;
    
    // Validate table name to prevent SQL injection
    const tableCheck = await pgPool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )`,
      [tableName]
    );
    
    if (!tableCheck.rows[0].exists) {
      return res.status(404).json({ error: 'Table not found' });
    }
    
    // Get total count
    const countResult = await pgPool.query(
      `SELECT COUNT(*) FROM ${tableName}`
    );
    
    // Fetch data with pagination
    const dataResult = await pgPool.query(
      `SELECT * FROM ${tableName} LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    
    res.status(200).json({
      tableName,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset),
      data: dataResult.rows
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

/**
 * GET /api/data/:tableName/schema
 * Get schema information for a table
 */
router.get('/:tableName/schema', authenticateToken, async (req, res) => {
  try {
    const { tableName } = req.params;
    
    const result = await pgPool.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Table not found' });
    }
    
    res.status(200).json({
      tableName,
      columns: result.rows
    });
  } catch (error) {
    console.error('Error fetching schema:', error);
    res.status(500).json({ error: 'Failed to fetch schema' });
  }
});

module.exports = router;

/**
 * Data routes for PostgreSQL database
 * Handles fetching and manipulating application data from PostgreSQL
 */

const express = require('express');
const { pgPool } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// ==================== PRODUCTS ====================

/**
 * GET /api/data/products
 * Fetch all products with stock levels
 */
router.get('/products', authenticateToken, async (req, res) => {
  try {
    const result = await pgPool.query(`
      SELECT 
        p.id,
        p.sku,
        p.name,
        p.description,
        p.category_id,
        pc.name as category_name,
        p.default_cost as cost_price,
        p.default_price,
        p.uom,
        COALESCE(SUM(sl.quantity), 0) as on_hand,
        COALESCE(SUM(sl.reserved), 0) as reserved,
        COALESCE(SUM(sl.quantity) - SUM(sl.reserved), 0) as free_to_use,
        p.created_at,
        p.updated_at
      FROM products p
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      LEFT JOIN stock_levels sl ON p.id = sl.product_id
      GROUP BY p.id, pc.name
      ORDER BY p.name
    `);
    
    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
});

// ==================== WAREHOUSES ====================

/**
 * GET /api/data/warehouses
 * Fetch all warehouses
 */
router.get('/warehouses', authenticateToken, async (req, res) => {
  try {
    const result = await pgPool.query(`
      SELECT 
        w.*,
        COUNT(l.id) as location_count
      FROM warehouses w
      LEFT JOIN locations l ON w.id = l.warehouse_id
      GROUP BY w.id
      ORDER BY w.name
    `);
    
    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch warehouses' });
  }
});

/**
 * POST /api/data/warehouses
 * Create a new warehouse
 */
router.post('/warehouses', authenticateToken, async (req, res) => {
  try {
    const { code, name, address, contact, metadata } = req.body;
    
    const result = await pgPool.query(`
      INSERT INTO warehouses (code, name, address, contact, metadata, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `, [code, name, address || null, contact || null, metadata || {}]);
    
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating warehouse:', error);
    res.status(500).json({ success: false, error: 'Failed to create warehouse' });
  }
});

/**
 * PUT /api/data/warehouses/:id
 * Update a warehouse
 */
router.put('/warehouses/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, address, contact, metadata } = req.body;
    
    const result = await pgPool.query(`
      UPDATE warehouses 
      SET code = $1, name = $2, address = $3, contact = $4, metadata = $5, updated_at = NOW()
      WHERE id = $6
      RETURNING *
    `, [code, name, address || null, contact || null, metadata || {}, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Warehouse not found' });
    }
    
    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating warehouse:', error);
    res.status(500).json({ success: false, error: 'Failed to update warehouse' });
  }
});

/**
 * DELETE /api/data/warehouses/:id
 * Delete a warehouse
 */
router.delete('/warehouses/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pgPool.query(`
      DELETE FROM warehouses WHERE id = $1 RETURNING *
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Warehouse not found' });
    }
    
    res.status(200).json({
      success: true,
      message: 'Warehouse deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting warehouse:', error);
    res.status(500).json({ success: false, error: 'Failed to delete warehouse' });
  }
});

// ==================== LOCATIONS ====================

/**
 * GET /api/data/locations
 * Fetch all locations with warehouse details
 */
router.get('/locations', authenticateToken, async (req, res) => {
  try {
    const result = await pgPool.query(`
      SELECT 
        l.*,
        w.code as warehouse_code,
        w.name as warehouse_name
      FROM locations l
      JOIN warehouses w ON l.warehouse_id = w.id
      ORDER BY w.name, l.name
    `);
    
    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch locations' });
  }
});

/**
 * POST /api/data/locations
 * Create a new location
 */
router.post('/locations', authenticateToken, async (req, res) => {
  try {
    const { warehouse_id, code, name, metadata } = req.body;
    
    const result = await pgPool.query(`
      INSERT INTO locations (warehouse_id, code, name, metadata, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *
    `, [warehouse_id, code, name, metadata || {}]);
    
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating location:', error);
    res.status(500).json({ success: false, error: 'Failed to create location' });
  }
});

/**
 * PUT /api/data/locations/:id
 * Update a location
 */
router.put('/locations/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { warehouse_id, code, name, metadata } = req.body;
    
    const result = await pgPool.query(`
      UPDATE locations 
      SET warehouse_id = $1, code = $2, name = $3, metadata = $4, updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `, [warehouse_id, code, name, metadata || {}, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Location not found' });
    }
    
    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ success: false, error: 'Failed to update location' });
  }
});

/**
 * DELETE /api/data/locations/:id
 * Delete a location
 */
router.delete('/locations/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pgPool.query(`
      DELETE FROM locations WHERE id = $1 RETURNING *
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Location not found' });
    }
    
    res.status(200).json({
      success: true,
      message: 'Location deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ success: false, error: 'Failed to delete location' });
  }
});

// ==================== RECEIPTS ====================

/**
 * GET /api/data/receipts
 * Fetch all receipts
 */
router.get('/receipts', authenticateToken, async (req, res) => {
  try {
    const result = await pgPool.query(`
      SELECT 
        r.*,
        s.name as supplier_name,
        COUNT(rl.id) as line_count
      FROM receipts r
      LEFT JOIN suppliers s ON r.supplier_id = s.id
      LEFT JOIN receipt_lines rl ON r.id = rl.receipt_id
      GROUP BY r.id, s.name
      ORDER BY r.created_at DESC
      LIMIT 100
    `);
    
    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching receipts:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch receipts' });
  }
});

// ==================== DELIVERIES ====================

/**
 * GET /api/data/deliveries
 * Fetch all deliveries
 */
router.get('/deliveries', authenticateToken, async (req, res) => {
  try {
    const result = await pgPool.query(`
      SELECT 
        d.*,
        o.order_no,
        o.customer_name,
        COUNT(dl.id) as line_count
      FROM deliveries d
      LEFT JOIN orders o ON d.order_id = o.id
      LEFT JOIN delivery_lines dl ON d.id = dl.delivery_id
      GROUP BY d.id, o.order_no, o.customer_name
      ORDER BY d.created_at DESC
      LIMIT 100
    `);
    
    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch deliveries' });
  }
});

// ==================== STOCK LEDGER ====================

/**
 * GET /api/data/stock-ledger
 * Fetch stock movement history
 */
router.get('/stock-ledger', authenticateToken, async (req, res) => {
  try {
    const result = await pgPool.query(`
      SELECT 
        sl.*,
        p.sku as product_sku,
        p.name as product_name,
        fl.code as from_location_code,
        tl.code as to_location_code
      FROM stock_ledger sl
      LEFT JOIN products p ON sl.product_id = p.id
      LEFT JOIN locations fl ON sl.from_location = fl.id
      LEFT JOIN locations tl ON sl.to_location = tl.id
      ORDER BY sl.created_at DESC
      LIMIT 200
    `);
    
    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching stock ledger:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stock ledger' });
  }
});

// ==================== SUPPLIERS ====================

/**
 * GET /api/data/suppliers
 * Fetch all suppliers
 */
router.get('/suppliers', authenticateToken, async (req, res) => {
  try {
    const result = await pgPool.query(`
      SELECT * FROM suppliers
      ORDER BY name ASC
    `);
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch suppliers' });
  }
});

// ==================== CUSTOMERS ====================

/**
 * GET /api/data/customers
 * Fetch all customers
 */
router.get('/customers', authenticateToken, async (req, res) => {
  try {
    const result = await pgPool.query(`
      SELECT * FROM customers
      ORDER BY name ASC
    `);
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch customers' });
  }
});

// ==================== LEGACY ROUTES (for DataViewer) ====================

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
      AND table_name NOT LIKE 'pg_%'
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
 * GET /api/data/table/:tableName
 * Fetch all data from a specific table (for DataViewer)
 */
router.get('/table/:tableName', authenticateToken, async (req, res) => {
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
 * GET /api/data/table/:tableName/schema
 * Get schema information for a table
 */
router.get('/table/:tableName/schema', authenticateToken, async (req, res) => {
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

// ==================== SETTINGS ====================

/**
 * GET /api/data/settings
 * Fetch all application settings
 */
router.get('/settings', authenticateToken, async (req, res) => {
  try {
    const result = await pgPool.query(`
      SELECT * FROM settings
      ORDER BY key
    `);
    
    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch settings' });
  }
});

/**
 * PUT /api/data/settings/:id
 * Update a specific setting
 */
router.put('/settings/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { key, value } = req.body;
    
    const result = await pgPool.query(`
      UPDATE settings
      SET key = $1, value = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `, [key, value, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Setting not found' });
    }
    
    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ success: false, error: 'Failed to update setting' });
  }
});

module.exports = router;

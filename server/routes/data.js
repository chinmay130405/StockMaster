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

/**
 * POST /api/data/receipts
 * Create a new receipt
 */
router.post('/receipts', authenticateToken, async (req, res) => {
  try {
    const { receipt_no, supplier_id, schedule_date, status, products } = req.body;
    
    // Start a transaction
    const client = await pgPool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Insert receipt (using receipt_date which is the actual column name)
      const receiptResult = await client.query(`
        INSERT INTO receipts (receipt_no, supplier_id, receipt_date, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING *
      `, [receipt_no, supplier_id, schedule_date, status || 'draft']);
      
      const receiptId = receiptResult.rows[0].id;
      
      // Insert receipt lines and stock ledger entries if products exist
      if (products && products.length > 0) {
        for (const product of products) {
          // Insert receipt line
          await client.query(`
            INSERT INTO receipt_lines (receipt_id, product_id, quantity, created_at, updated_at)
            VALUES ($1, $2, $3, NOW(), NOW())
          `, [receiptId, product.product_id, product.quantity]);
          
          // Get product details for stock ledger
          const productResult = await client.query(
            'SELECT sku, uom FROM products WHERE id = $1',
            [product.product_id]
          );
          
          // Get or create default warehouse location
          const locationResult = await client.query(
            "SELECT id FROM locations WHERE code = 'WH/Stock' LIMIT 1"
          );
          const toLocationId = locationResult.rows[0]?.id;
          
          // Insert into stock_ledger for move history
          await client.query(`
            INSERT INTO stock_ledger (
              occurred_at, event_type, product_id, qty_delta, uom,
              from_location, to_location, source_type, source_id, created_by
            )
            VALUES (NOW(), 'receipt', $1, $2, $3, NULL, $4, 'receipt', $5, NULL)
          `, [
            product.product_id,
            product.quantity,
            productResult.rows[0]?.uom || 'Units',
            toLocationId,
            receiptId
          ]);
        }
      }
      
      await client.query('COMMIT');
      
      res.status(201).json({
        success: true,
        data: receiptResult.rows[0]
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating receipt:', error);
    res.status(500).json({ success: false, error: 'Failed to create receipt' });
  }
});

/**
 * PUT /api/data/receipts/:id
 * Update receipt status
 */
router.put('/receipts/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const result = await pgPool.query(`
      UPDATE receipts
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [status, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Receipt not found' });
    }
    
    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating receipt:', error);
    res.status(500).json({ success: false, error: 'Failed to update receipt' });
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

/**
 * POST /api/data/deliveries
 * Create a new delivery
 */
router.post('/deliveries', authenticateToken, async (req, res) => {
  try {
    const { delivery_no, order_id, delivery_address, schedule_date, status, products } = req.body;
    
    // Start a transaction
    const client = await pgPool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Insert delivery (using delivery_date which is the actual column name)
      const deliveryResult = await client.query(`
        INSERT INTO deliveries (delivery_no, order_id, delivery_address, delivery_date, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING *
      `, [delivery_no, order_id, delivery_address, schedule_date, status || 'draft']);
      
      const deliveryId = deliveryResult.rows[0].id;
      
      // Insert delivery lines and stock ledger entries if products exist
      if (products && products.length > 0) {
        for (const product of products) {
          // Insert delivery line
          await client.query(`
            INSERT INTO delivery_lines (delivery_id, product_id, quantity, created_at, updated_at)
            VALUES ($1, $2, $3, NOW(), NOW())
          `, [deliveryId, product.product_id, product.quantity]);
          
          // Get product details for stock ledger
          const productResult = await client.query(
            'SELECT sku, uom FROM products WHERE id = $1',
            [product.product_id]
          );
          
          // Get warehouse location
          const locationResult = await client.query(
            "SELECT id FROM locations WHERE code = 'WH/Stock' LIMIT 1"
          );
          const fromLocationId = locationResult.rows[0]?.id;
          
          // Insert into stock_ledger for move history (negative quantity for delivery)
          await client.query(`
            INSERT INTO stock_ledger (
              occurred_at, event_type, product_id, qty_delta, uom,
              from_location, to_location, source_type, source_id, created_by
            )
            VALUES (NOW(), 'delivery', $1, $2, $3, $4, NULL, 'delivery', $5, NULL)
          `, [
            product.product_id,
            -product.quantity, // Negative for outgoing delivery
            productResult.rows[0]?.uom || 'Units',
            fromLocationId,
            deliveryId
          ]);
        }
      }
      
      await client.query('COMMIT');
      
      res.status(201).json({
        success: true,
        data: deliveryResult.rows[0]
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating delivery:', error);
    res.status(500).json({ success: false, error: 'Failed to create delivery' });
  }
});

/**
 * PUT /api/data/deliveries/:id
 * Update delivery status
 */
router.put('/deliveries/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const result = await pgPool.query(`
      UPDATE deliveries
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [status, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Delivery not found' });
    }
    
    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating delivery:', error);
    res.status(500).json({ success: false, error: 'Failed to update delivery' });
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
        sl.id,
        sl.occurred_at as created_at,
        sl.tx_id,
        sl.event_type,
        sl.product_id,
        sl.qty_delta,
        sl.uom,
        sl.from_location,
        sl.to_location,
        sl.source_type,
        sl.source_id,
        sl.created_by,
        p.sku as product_sku,
        p.name as product_name,
        COALESCE(fl.code, 'Vendor') as from_location_code,
        COALESCE(tl.code, 'N/A') as to_location_code,
        CASE 
          WHEN sl.source_type = 'initial_seed' THEN 'Initial Stock'
          WHEN sl.source_type = 'initial_populate' THEN 'Initial Import'
          WHEN sl.source_type IS NOT NULL THEN sl.source_type
          ELSE 'Manual Entry'
        END as source,
        COALESCE(sl.created_by::text, 'System') as created_by_username
      FROM stock_ledger sl
      LEFT JOIN products p ON sl.product_id = p.id
      LEFT JOIN locations fl ON sl.from_location = fl.id
      LEFT JOIN locations tl ON sl.to_location = tl.id
      WHERE sl.source_type NOT IN ('initial_seed', 'initial_populate')
         OR sl.id IN (
           SELECT id FROM stock_ledger 
           WHERE source_type IN ('initial_seed', 'initial_populate')
           ORDER BY occurred_at ASC
           LIMIT 3
         )
      ORDER BY sl.occurred_at DESC
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

// ==================== INTERNAL TRANSFERS ====================

/**
 * GET /api/data/internal-transfers
 * Fetch all internal transfers
 */
router.get('/internal-transfers', authenticateToken, async (req, res) => {
  try {
    const result = await pgPool.query(`
      SELECT * FROM internal_transfers
      ORDER BY created_at DESC
    `);
    
    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching internal transfers:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch internal transfers' });
  }
});

/**
 * POST /api/data/internal-transfers
 * Create a new internal transfer
 */
router.post('/internal-transfers', authenticateToken, async (req, res) => {
  try {
    const { transfer_no, from_location_id, to_location_id, transfer_date, status, products } = req.body;
    
    const client = await pgPool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Insert internal transfer
      const transferResult = await client.query(`
        INSERT INTO internal_transfers (transfer_no, from_location_id, to_location_id, transfer_date, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING *
      `, [transfer_no, from_location_id, to_location_id, transfer_date, status || 'draft']);
      
      const transferId = transferResult.rows[0].id;
      
      // Insert transfer lines and stock ledger entries
      if (products && products.length > 0) {
        for (const product of products) {
          // Insert transfer line
          await client.query(`
            INSERT INTO transfer_lines (transfer_id, product_id, quantity, created_at, updated_at)
            VALUES ($1, $2, $3, NOW(), NOW())
          `, [transferId, product.product_id, product.quantity]);
          
          // Get product details
          const productResult = await client.query(
            'SELECT sku, uom FROM products WHERE id = $1',
            [product.product_id]
          );
          
          // Insert into stock_ledger for move history
          await client.query(`
            INSERT INTO stock_ledger (
              occurred_at, event_type, product_id, qty_delta, uom,
              from_location, to_location, source_type, source_id, created_by
            )
            VALUES (NOW(), 'transfer', $1, $2, $3, $4, $5, 'internal_transfer', $6, NULL)
          `, [
            product.product_id,
            product.quantity,
            productResult.rows[0]?.uom || 'Units',
            from_location_id,
            to_location_id,
            transferId
          ]);
        }
      }
      
      await client.query('COMMIT');
      
      res.status(201).json({
        success: true,
        data: transferResult.rows[0]
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating internal transfer:', error);
    res.status(500).json({ success: false, error: 'Failed to create internal transfer' });
  }
});

// ==================== STOCK ADJUSTMENTS ====================

/**
 * GET /api/data/stock-adjustments
 * Fetch all stock adjustments
 */
router.get('/stock-adjustments', authenticateToken, async (req, res) => {
  try {
    const result = await pgPool.query(`
      SELECT * FROM stock_adjustments
      ORDER BY created_at DESC
    `);
    
    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching stock adjustments:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stock adjustments' });
  }
});

/**
 * POST /api/data/stock-adjustments
 * Create a new stock adjustment
 */
router.post('/stock-adjustments', authenticateToken, async (req, res) => {
  try {
    const { adjustment_no, location_id, adjustment_date, reason, status, products } = req.body;
    
    const client = await pgPool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Insert stock adjustment
      const adjustmentResult = await client.query(`
        INSERT INTO stock_adjustments (adjustment_no, location_id, adjustment_date, reason, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING *
      `, [adjustment_no, location_id, adjustment_date, reason, status || 'draft']);
      
      const adjustmentId = adjustmentResult.rows[0].id;
      
      // Insert adjustment lines and stock ledger entries
      if (products && products.length > 0) {
        for (const product of products) {
          const difference = product.counted_qty - product.current_qty;
          
          // Insert adjustment line
          await client.query(`
            INSERT INTO adjustment_lines (adjustment_id, product_id, counted_qty, difference, created_at, updated_at)
            VALUES ($1, $2, $3, $4, NOW(), NOW())
          `, [adjustmentId, product.product_id, product.counted_qty, difference]);
          
          // Get product details
          const productResult = await client.query(
            'SELECT sku, uom FROM products WHERE id = $1',
            [product.product_id]
          );
          
          // Insert into stock_ledger for move history (only if there's a difference)
          if (difference !== 0) {
            await client.query(`
              INSERT INTO stock_ledger (
                occurred_at, event_type, product_id, qty_delta, uom,
                from_location, to_location, source_type, source_id, created_by
              )
              VALUES (NOW(), 'adjustment', $1, $2, $3, NULL, $4, 'stock_adjustment', $5, NULL)
            `, [
              product.product_id,
              difference,
              productResult.rows[0]?.uom || 'Units',
              location_id,
              adjustmentId
            ]);
          }
        }
      }
      
      await client.query('COMMIT');
      
      res.status(201).json({
        success: true,
        data: adjustmentResult.rows[0]
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating stock adjustment:', error);
    res.status(500).json({ success: false, error: 'Failed to create stock adjustment' });
  }
});

module.exports = router;

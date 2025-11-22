/**
 * Inventory routes
 * Handles products, warehouses, locations, receipts, deliveries, stock operations
 */

const express = require('express');
const router = express.Router();

/**
 * GET /api/inventory/products
 * Get all products with stock levels
 */
router.get('/products', async (req, res) => {
  try {
    const { pool } = require('../db');
    
    const query = `
      SELECT 
        p.id,
        p.sku,
        p.name,
        p.category_id,
        p.uom,
        p.default_cost,
        p.default_price,
        p.reorder_level,
        p.status,
        COALESCE(SUM(sl.quantity), 0) as on_hand,
        COALESCE(SUM(sl.quantity), 0) as free_to_use,
        pc.name as category_name
      FROM products p
      LEFT JOIN stock_levels sl ON p.id = sl.product_id
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      GROUP BY p.id, p.sku, p.name, p.category_id, p.uom, p.default_cost, p.default_price, p.reorder_level, p.status, pc.name
      ORDER BY p.name
    `;
    
    const result = await pool.query(query);
    
    console.log(`✅ Retrieved ${result.rows.length} products from database`);
    
    res.status(200).json({
      success: true,
      count: result.rows.length,
      products: result.rows
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ 
      error: 'Database error',
      details: error.message
    });
  }
});

/**
 * GET /api/inventory/warehouses
 * Get all warehouses
 */
router.get('/warehouses', async (req, res) => {
  try {
    const { pool } = require('../db');
    
    const result = await pool.query(`
      SELECT 
        id,
        name,
        code,
        address,
        created_at
      FROM warehouses
      ORDER BY name
    `);
    
    console.log(`✅ Retrieved ${result.rows.length} warehouses from database`);
    
    res.status(200).json({
      success: true,
      count: result.rows.length,
      warehouses: result.rows
    });
  } catch (error) {
    console.error('Get warehouses error:', error);
    res.status(500).json({ 
      error: 'Database error',
      details: error.message
    });
  }
});

/**
 * GET /api/inventory/locations
 * Get all locations
 */
router.get('/locations', async (req, res) => {
  try {
    const { pool } = require('../db');
    
    const result = await pool.query(`
      SELECT 
        l.id,
        l.name,
        l.code,
        l.warehouse_id,
        w.name as warehouse_name,
        w.code as warehouse_code
      FROM locations l
      LEFT JOIN warehouses w ON l.warehouse_id = w.id
      ORDER BY w.name, l.name
    `);
    
    console.log(`✅ Retrieved ${result.rows.length} locations from database`);
    
    res.status(200).json({
      success: true,
      count: result.rows.length,
      locations: result.rows
    });
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({ 
      error: 'Database error',
      details: error.message
    });
  }
});

/**
 * GET /api/inventory/receipts
 * Get all receipts
 */
router.get('/receipts', async (req, res) => {
  try {
    const { pool } = require('../db');
    
    const result = await pool.query(`
      SELECT 
        r.id,
        r.receipt_no,
        r.receipt_date,
        r.supplier_id,
        r.supplier_invoice_no,
        r.received_by,
        r.status,
        r.notes,
        r.created_at,
        COUNT(rl.id) as line_count
      FROM receipts r
      LEFT JOIN receipt_lines rl ON r.id = rl.receipt_id
      GROUP BY r.id, r.receipt_no, r.receipt_date, r.supplier_id, r.supplier_invoice_no, r.received_by, r.status, r.notes, r.created_at
      ORDER BY r.created_at DESC
    `);
    
    console.log(`✅ Retrieved ${result.rows.length} receipts from database`);
    
    res.status(200).json({
      success: true,
      count: result.rows.length,
      receipts: result.rows
    });
  } catch (error) {
    console.error('Get receipts error:', error);
    res.status(500).json({ 
      error: 'Database error',
      details: error.message
    });
  }
});

/**
 * GET /api/inventory/deliveries
 * Get all deliveries
 */
router.get('/deliveries', async (req, res) => {
  try {
    const { pool } = require('../db');
    
    const result = await pool.query(`
      SELECT 
        d.id,
        d.delivery_no,
        d.delivery_address,
        d.delivery_date,
        d.expected_delivery_date,
        d.status,
        d.delivered_by,
        d.tracking_number,
        d.carrier,
        d.created_at,
        COUNT(dl.id) as line_count
      FROM deliveries d
      LEFT JOIN delivery_lines dl ON d.id = dl.delivery_id
      GROUP BY d.id, d.delivery_no, d.delivery_address, d.delivery_date, d.expected_delivery_date, d.status, d.delivered_by, d.tracking_number, d.carrier, d.created_at
      ORDER BY d.created_at DESC
    `);
    
    console.log(`✅ Retrieved ${result.rows.length} deliveries from database`);
    
    res.status(200).json({
      success: true,
      count: result.rows.length,
      deliveries: result.rows
    });
  } catch (error) {
    console.error('Get deliveries error:', error);
    res.status(500).json({ 
      error: 'Database error',
      details: error.message
    });
  }
});

/**
 * POST /api/inventory/receipts
 * Create a new receipt
 */
router.post('/receipts', async (req, res) => {
  const client = await require('../db').pool.connect();
  
  try {
    const { receiveFrom, responsible, scheduleDate, warehouseId, notes, lines } = req.body;

    // Validation
    if (!lines || lines.length === 0) {
      return res.status(400).json({ error: 'Missing required fields - need at least one product line' });
    }

    await client.query('BEGIN');

    // Generate receipt number
    const countResult = await client.query('SELECT COUNT(*) as count FROM receipts');
    const receiptCount = parseInt(countResult.rows[0].count) + 1;
    const receiptNo = `WH/IN/${String(receiptCount).padStart(4, '0')}`;

    // Insert receipt header
    const receiptResult = await client.query(
      `INSERT INTO receipts (receipt_no, receipt_date, supplier_invoice_no, status, notes, created_at, updated_at)
       VALUES ($1, $2, $3, 'Draft', $4, NOW(), NOW())
       RETURNING id`,
      [receiptNo, scheduleDate || new Date(), receiveFrom || null, notes || null]
    );

    const receiptId = receiptResult.rows[0].id;

    // Insert receipt lines (without location_id since it doesn't exist in the schema)
    for (const line of lines) {
      const lineTotal = (parseFloat(line.quantity) || 0) * (parseFloat(line.unitCost) || 0);
      
      await client.query(
        `INSERT INTO receipt_lines (receipt_id, product_id, quantity, unit_cost, line_total, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [receiptId, line.productId, line.quantity, line.unitCost || 0, lineTotal]
      );
    }

    await client.query('COMMIT');

    console.log(`✅ Created receipt ${receiptNo} with ${lines.length} lines`);

    res.status(201).json({
      success: true,
      message: 'Receipt created successfully',
      receipt: {
        id: receiptId,
        receiptNo: receiptNo
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create receipt error:', error);
    res.status(500).json({ 
      error: 'Failed to create receipt',
      details: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * GET /api/inventory/receipts/:id
 * Get receipt details with lines
 */
router.get('/receipts/:id', async (req, res) => {
  try {
    const { pool } = require('../db');
    const { id } = req.params;

    // Get receipt header
    const receiptResult = await pool.query(
      `SELECT 
        r.id,
        r.document_no,
        r.receive_from,
        r.responsible,
        r.schedule_date,
        r.status,
        r.notes,
        r.created_at,
        r.updated_at
      FROM receipts r
      WHERE r.id = $1`,
      [id]
    );

    if (receiptResult.rows.length === 0) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    const receipt = receiptResult.rows[0];

    // Get receipt lines
    const linesResult = await pool.query(
      `SELECT 
        rl.id,
        rl.product_id,
        rl.location_id,
        rl.quantity,
        rl.unit_cost,
        p.name as product_name,
        p.sku,
        p.uom,
        l.name as location_name,
        w.name as warehouse_name
      FROM receipt_lines rl
      JOIN products p ON rl.product_id = p.id
      JOIN locations l ON rl.location_id = l.id
      JOIN warehouses w ON l.warehouse_id = w.id
      WHERE rl.receipt_id = $1
      ORDER BY rl.id`,
      [id]
    );

    receipt.lines = linesResult.rows;

    res.status(200).json({
      success: true,
      receipt
    });
  } catch (error) {
    console.error('Get receipt details error:', error);
    res.status(500).json({ 
      error: 'Database error',
      details: error.message
    });
  }
});

/**
 * PUT /api/inventory/receipts/:id/validate
 * Validate receipt (move from Draft to Ready)
 */
router.put('/receipts/:id/validate', async (req, res) => {
  try {
    const { pool } = require('../db');
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE receipts 
       SET status = 'Ready', updated_at = NOW()
       WHERE id = $1 AND status = 'Draft'
       RETURNING id, document_no, status`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Receipt not found or already validated' });
    }

    console.log(`✅ Validated receipt ${result.rows[0].document_no}`);

    res.status(200).json({
      success: true,
      message: 'Receipt validated successfully',
      receipt: result.rows[0]
    });
  } catch (error) {
    console.error('Validate receipt error:', error);
    res.status(500).json({ 
      error: 'Failed to validate receipt',
      details: error.message
    });
  }
});

/**
 * PUT /api/inventory/receipts/:id/process
 * Process receipt (receive into stock - move from Ready to Done)
 */
router.put('/receipts/:id/process', async (req, res) => {
  const client = await require('../db').pool.connect();

  try {
    const { id } = req.params;

    await client.query('BEGIN');

    // Get receipt lines
    const linesResult = await client.query(
      `SELECT rl.*, r.status
       FROM receipt_lines rl
       JOIN receipts r ON rl.receipt_id = r.id
       WHERE rl.receipt_id = $1`,
      [id]
    );

    if (linesResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Receipt not found' });
    }

    const receiptStatus = linesResult.rows[0].status;
    if (receiptStatus !== 'Ready') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Receipt must be in Ready status to process' });
    }

    // Update or insert stock levels for each line
    for (const line of linesResult.rows) {
      // Check if stock level exists
      const stockCheck = await client.query(
        `SELECT id, quantity FROM stock_levels 
         WHERE product_id = $1 AND location_id = $2`,
        [line.product_id, line.location_id]
      );

      if (stockCheck.rows.length > 0) {
        // Update existing stock
        await client.query(
          `UPDATE stock_levels 
           SET quantity = quantity + $1, updated_at = NOW()
           WHERE product_id = $2 AND location_id = $3`,
          [line.quantity, line.product_id, line.location_id]
        );
      } else {
        // Insert new stock level
        await client.query(
          `INSERT INTO stock_levels (product_id, location_id, quantity, created_at, updated_at)
           VALUES ($1, $2, $3, NOW(), NOW())`,
          [line.product_id, line.location_id, line.quantity]
        );
      }

      // Create stock movement record
      await client.query(
        `INSERT INTO stock_movements (
          product_id, location_id, movement_type, quantity, 
          reference_type, reference_id, created_at
        )
        VALUES ($1, $2, 'in', $3, 'receipt', $4, NOW())`,
        [line.product_id, line.location_id, line.quantity, id]
      );
    }

    // Update receipt status to Done
    await client.query(
      `UPDATE receipts 
       SET status = 'Done', updated_at = NOW()
       WHERE id = $1`,
      [id]
    );

    await client.query('COMMIT');

    console.log(`✅ Processed receipt ID ${id} - stock updated`);

    res.status(200).json({
      success: true,
      message: 'Receipt processed successfully - stock updated'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Process receipt error:', error);
    res.status(500).json({ 
      error: 'Failed to process receipt',
      details: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * GET /api/inventory/stock-movements
 * Get all stock movements (receipts, deliveries, internal transfers)
 */
router.get('/stock-movements', async (req, res) => {
  try {
    const { pool } = require('../db');
    const { startDate, endDate, movementType } = req.query;

    const movements = [];

    // Get receipt movements
    const receiptsQuery = `
      SELECT 
        rl.id,
        'receipt' as movement_type,
        'in' as direction,
        rl.quantity,
        r.receipt_no as document_no,
        r.receipt_date as movement_date,
        p.name as product_name,
        p.sku,
        p.uom,
        r.supplier_invoice_no as reference,
        r.status,
        r.created_at
      FROM receipt_lines rl
      JOIN receipts r ON rl.receipt_id = r.id
      JOIN products p ON rl.product_id = p.id
      WHERE 1=1
      ${startDate ? "AND r.receipt_date >= $1" : ""}
      ${endDate ? "AND r.receipt_date <= $2" : ""}
      ORDER BY r.receipt_date DESC
      LIMIT 200
    `;

    const receiptParams = [];
    if (startDate) receiptParams.push(startDate);
    if (endDate) receiptParams.push(endDate);

    const receiptsResult = await pool.query(receiptsQuery, receiptParams);
    movements.push(...receiptsResult.rows);

    // Get delivery movements
    const deliveriesQuery = `
      SELECT 
        dl.id,
        'delivery' as movement_type,
        'out' as direction,
        dl.quantity,
        d.delivery_no as document_no,
        d.delivery_date as movement_date,
        p.name as product_name,
        p.sku,
        p.uom,
        d.delivery_address as reference,
        d.status,
        d.created_at
      FROM delivery_lines dl
      JOIN deliveries d ON dl.delivery_id = d.id
      JOIN products p ON dl.product_id = p.id
      WHERE 1=1
      ${startDate ? "AND d.delivery_date >= $1" : ""}
      ${endDate ? "AND d.delivery_date <= $2" : ""}
      ORDER BY d.delivery_date DESC
      LIMIT 200
    `;

    const deliveryParams = [];
    if (startDate) deliveryParams.push(startDate);
    if (endDate) deliveryParams.push(endDate);

    const deliveriesResult = await pool.query(deliveriesQuery, deliveryParams);
    movements.push(...deliveriesResult.rows);

    // Get internal transfer movements
    const transfersQuery = `
      SELECT 
        itl.id,
        'transfer' as movement_type,
        'transfer' as direction,
        itl.quantity,
        it.transfer_no as document_no,
        it.created_at as movement_date,
        p.name as product_name,
        p.sku,
        p.uom,
        l_from.name || ' → ' || l_to.name as reference,
        it.status,
        it.created_at
      FROM internal_transfer_lines itl
      JOIN internal_transfers it ON itl.transfer_id = it.id
      JOIN products p ON itl.product_id = p.id
      LEFT JOIN locations l_from ON it.from_location = l_from.id
      LEFT JOIN locations l_to ON it.to_location = l_to.id
      WHERE 1=1
      ${startDate ? "AND it.created_at >= $1" : ""}
      ${endDate ? "AND it.created_at <= $2" : ""}
      ORDER BY it.created_at DESC
      LIMIT 200
    `;

    const transferParams = [];
    if (startDate) transferParams.push(startDate);
    if (endDate) transferParams.push(endDate);

    const transfersResult = await pool.query(transfersQuery, transferParams);
    movements.push(...transfersResult.rows);

    // Sort all movements by date
    movements.sort((a, b) => new Date(b.movement_date || b.created_at) - new Date(a.movement_date || a.created_at));

    // Apply movement type filter if specified
    let filteredMovements = movements;
    if (movementType) {
      if (movementType === 'in') {
        filteredMovements = movements.filter(m => m.direction === 'in');
      } else if (movementType === 'out') {
        filteredMovements = movements.filter(m => m.direction === 'out');
      } else if (movementType === 'adjustment' || movementType === 'transfer') {
        filteredMovements = movements.filter(m => m.movement_type === 'transfer');
      }
    }

    console.log(`✅ Retrieved ${filteredMovements.length} stock movements (${receiptsResult.rows.length} receipts, ${deliveriesResult.rows.length} deliveries, ${transfersResult.rows.length} transfers)`);

    res.status(200).json({
      success: true,
      count: filteredMovements.length,
      movements: filteredMovements
    });
  } catch (error) {
    console.error('Get stock movements error:', error);
    res.status(500).json({ 
      error: 'Database error',
      details: error.message
    });
  }
});

/**
 * GET /api/inventory/stock-levels
 * Get all stock levels
 */
router.get('/stock-levels', async (req, res) => {
  try {
    const { pool } = require('../db');
    
    const result = await pool.query(`
      SELECT 
        sl.id,
        sl.product_id,
        sl.location_id,
        sl.quantity,
        p.name as product_name,
        p.sku,
        l.name as location_name,
        w.name as warehouse_name
      FROM stock_levels sl
      JOIN products p ON sl.product_id = p.id
      JOIN locations l ON sl.location_id = l.id
      JOIN warehouses w ON l.warehouse_id = w.id
      ORDER BY p.name, l.name
    `);
    
    console.log(`✅ Retrieved ${result.rows.length} stock levels from database`);
    
    res.status(200).json({
      success: true,
      count: result.rows.length,
      stockLevels: result.rows
    });
  } catch (error) {
    console.error('Get stock levels error:', error);
    res.status(500).json({ 
      error: 'Database error',
      details: error.message
    });
  }
});

/**
 * POST /api/inventory/adjustments
 * Create a new inventory adjustment
 */
router.post('/adjustments', async (req, res) => {
  const client = await require('../db').pool.connect();
  
  try {
    const { adjustmentDate, reason, responsible, notes, lines } = req.body;

    // Validation
    if (!lines || lines.length === 0) {
      return res.status(400).json({ error: 'Missing required fields - need at least one adjustment line' });
    }

    await client.query('BEGIN');

    // Generate adjustment number
    const countResult = await client.query('SELECT COUNT(*) as count FROM stock_movements WHERE movement_type = \'adjustment\'');
    const adjustmentCount = parseInt(countResult.rows[0].count) + 1;
    const adjustmentNo = `WH/ADJ/${String(adjustmentCount).padStart(4, '0')}`;

    // Insert adjustment lines and update stock
    for (const line of lines) {
      // Check if stock level exists
      const stockCheck = await client.query(
        `SELECT id, quantity FROM stock_levels 
         WHERE product_id = $1 AND location_id = $2`,
        [line.productId, line.locationId]
      );

      if (stockCheck.rows.length > 0) {
        // Update existing stock
        await client.query(
          `UPDATE stock_levels 
           SET quantity = quantity + $1, updated_at = NOW()
           WHERE product_id = $2 AND location_id = $3`,
          [line.adjustmentQuantity, line.productId, line.locationId]
        );
      } else {
        // Insert new stock level (if adjustment is positive)
        if (line.adjustmentQuantity > 0) {
          await client.query(
            `INSERT INTO stock_levels (product_id, location_id, quantity, created_at, updated_at)
             VALUES ($1, $2, $3, NOW(), NOW())`,
            [line.productId, line.locationId, line.adjustmentQuantity]
          );
        }
      }

      // Create stock movement record
      await client.query(
        `INSERT INTO stock_movements (
          product_id, location_id, movement_type, quantity, 
          reference_type, reference_id, notes, created_at
        )
        VALUES ($1, $2, 'adjustment', $3, 'adjustment', $4, $5, NOW())`,
        [
          line.productId, 
          line.locationId, 
          line.adjustmentQuantity,
          adjustmentNo,
          `${reason} - ${line.lineReason || ''}`.trim()
        ]
      );
    }

    await client.query('COMMIT');

    console.log(`✅ Created adjustment ${adjustmentNo} with ${lines.length} lines`);

    res.status(201).json({
      success: true,
      message: 'Adjustment created successfully',
      adjustment: {
        adjustmentNo: adjustmentNo
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create adjustment error:', error);
    res.status(500).json({ 
      error: 'Failed to create adjustment',
      details: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * POST /api/inventory/deliveries
 * Create a new delivery
 */
router.post('/deliveries', async (req, res) => {
  const client = await require('../db').pool.connect();
  
  try {
    const { deliveryAddress, responsible, scheduleDate, warehouseId, notes, lines } = req.body;

    // Validation
    if (!lines || lines.length === 0) {
      return res.status(400).json({ error: 'Missing required fields - need at least one product line' });
    }

    await client.query('BEGIN');

    // Generate delivery number
    const countResult = await client.query('SELECT COUNT(*) as count FROM deliveries');
    const deliveryCount = parseInt(countResult.rows[0].count) + 1;
    const deliveryNo = `WH/OUT/${String(deliveryCount).padStart(4, '0')}`;

    // Insert delivery header
    const deliveryResult = await client.query(
      `INSERT INTO deliveries (delivery_no, delivery_address, expected_delivery_date, delivered_by, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'Draft', NOW(), NOW())
       RETURNING id`,
      [deliveryNo, deliveryAddress, scheduleDate || new Date(), responsible || null]
    );

    const deliveryId = deliveryResult.rows[0].id;

    // Insert delivery lines
    for (const line of lines) {
      const lineTotal = (parseFloat(line.quantity) || 0) * (parseFloat(line.unitPrice) || 0);
      
      await client.query(
        `INSERT INTO delivery_lines (delivery_id, product_id, quantity, unit_price, line_total, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [deliveryId, line.productId, line.quantity, line.unitPrice || 0, lineTotal]
      );
    }

    await client.query('COMMIT');

    console.log(`✅ Created delivery ${deliveryNo} with ${lines.length} lines`);

    res.status(201).json({
      success: true,
      message: 'Delivery created successfully',
      delivery: {
        id: deliveryId,
        deliveryNo: deliveryNo
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create delivery error:', error);
    res.status(500).json({ 
      error: 'Failed to create delivery',
      details: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * GET /api/inventory/dashboard-stats
 * Get dashboard statistics
 */
router.get('/dashboard-stats', async (req, res) => {
  try {
    const { pool } = require('../db');
    
    // Get total products
    const productsResult = await pool.query('SELECT COUNT(*) as count FROM products');
    const totalProducts = parseInt(productsResult.rows[0].count);
    
    // Get total warehouses
    const warehousesResult = await pool.query('SELECT COUNT(*) as count FROM warehouses');
    const totalWarehouses = parseInt(warehousesResult.rows[0].count);
    
    // Get total locations
    const locationsResult = await pool.query('SELECT COUNT(*) as count FROM locations');
    const totalLocations = parseInt(locationsResult.rows[0].count);
    
    // Get pending receipts (status != 'Done')
    const receiptsResult = await pool.query("SELECT COUNT(*) as count FROM receipts WHERE status != 'Done'");
    const pendingReceipts = parseInt(receiptsResult.rows[0].count);
    
    // Get pending deliveries (status != 'Done')
    const deliveriesResult = await pool.query("SELECT COUNT(*) as count FROM deliveries WHERE status != 'Done'");
    const pendingDeliveries = parseInt(deliveriesResult.rows[0].count);
    
    // Get low stock items (quantity < reorder_level)
    const lowStockResult = await pool.query(`
      SELECT COUNT(DISTINCT p.id) as count 
      FROM products p
      LEFT JOIN stock_levels sl ON p.id = sl.product_id
      WHERE p.reorder_level IS NOT NULL 
      AND COALESCE(sl.quantity, 0) < p.reorder_level
    `);
    const lowStockItems = parseInt(lowStockResult.rows[0].count);
    
    const stats = {
      totalProducts,
      totalWarehouses,
      totalLocations,
      pendingReceipts,
      pendingDeliveries,
      lowStockItems
    };
    
    console.log('✅ Dashboard stats:', stats);
    
    res.status(200).json(stats);
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ 
      error: 'Database error',
      details: error.message
    });
  }
});

module.exports = router;

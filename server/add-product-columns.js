/**
 * Migration script to add min_stock and reorder_point columns to products table
 */

const { pgPool } = require('./db');

async function addColumns() {
  const client = await pgPool.connect();
  
  try {
    console.log('🔧 Adding min_stock and reorder_point columns to products table...');
    
    // Check if columns exist
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name IN ('min_stock', 'reorder_point')
    `;
    
    const existing = await client.query(checkQuery);
    const existingColumns = existing.rows.map(r => r.column_name);
    
    // Add min_stock if it doesn't exist
    if (!existingColumns.includes('min_stock')) {
      await client.query(`
        ALTER TABLE products 
        ADD COLUMN min_stock NUMERIC(10, 4) DEFAULT 0
      `);
      console.log('✅ Added min_stock column');
    } else {
      console.log('ℹ️  min_stock column already exists');
    }
    
    // Add reorder_point if it doesn't exist
    if (!existingColumns.includes('reorder_point')) {
      await client.query(`
        ALTER TABLE products 
        ADD COLUMN reorder_point NUMERIC(10, 4) DEFAULT 0
      `);
      console.log('✅ Added reorder_point column');
    } else {
      console.log('ℹ️  reorder_point column already exists');
    }
    
    // Set some default values for existing products
    await client.query(`
      UPDATE products 
      SET min_stock = 5, reorder_point = 10 
      WHERE min_stock IS NULL OR min_stock = 0
    `);
    console.log('✅ Set default values for existing products');
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pgPool.end();
  }
}

addColumns();

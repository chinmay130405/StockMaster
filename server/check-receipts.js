const { pgPool } = require('./db');

async function checkReceiptsColumns() {
  try {
    const result = await pgPool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'receipts' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n=== RECEIPTS TABLE COLUMNS ===');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name} (${row.data_type})`);
    });
    console.log('==============================\n');
    
    // Also get a sample receipt
    const sample = await pgPool.query('SELECT * FROM receipts LIMIT 1');
    if (sample.rows[0]) {
      console.log('Sample receipt columns:', Object.keys(sample.rows[0]).join(', '));
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkReceiptsColumns();

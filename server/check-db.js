/**
 * Script to check PostgreSQL database tables and structure
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

async function checkDatabase() {
  try {
    console.log('🔍 Checking PostgreSQL database...\n');
    
    // List all tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 Tables found:');
    console.log(tablesResult.rows.map(r => r.table_name).join(', '));
    console.log('\n');
    
    // Get schema and sample data for each table
    for (const { table_name } of tablesResult.rows) {
      console.log(`\n📊 Table: ${table_name}`);
      console.log('─'.repeat(60));
      
      // Get columns
      const columnsResult = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, [table_name]);
      
      console.log('Columns:');
      columnsResult.rows.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type})`);
      });
      
      // Get row count
      const countResult = await pool.query(`SELECT COUNT(*) FROM ${table_name}`);
      console.log(`\nRow count: ${countResult.rows[0].count}`);
      
      // Get sample data (first 3 rows)
      const sampleResult = await pool.query(`SELECT * FROM ${table_name} LIMIT 3`);
      if (sampleResult.rows.length > 0) {
        console.log('\nSample data:');
        console.log(JSON.stringify(sampleResult.rows, null, 2));
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkDatabase();

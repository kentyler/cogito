const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
  try {
    console.log('Checking client_mgmt schema tables...');
    const result = await pool.query(`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'client_mgmt'
      ORDER BY table_name, ordinal_position
    `);
    
    console.log('Found', result.rows.length, 'columns total');
    const tables = {};
    result.rows.forEach(row => {
      if (!tables[row.table_name]) tables[row.table_name] = [];
      tables[row.table_name].push(`${row.column_name} (${row.data_type})`);
    });
    
    console.log('\nTables in client_mgmt schema:');
    Object.keys(tables).forEach(table => {
      console.log(`\n${table}:`);
      tables[table].forEach(col => console.log(`  - ${col}`));
    });
    
    if (Object.keys(tables).length === 0) {
      console.log('❌ No tables found in client_mgmt schema!');
    }
    
    // Also check what schemas exist
    console.log('\n📋 All schemas:');
    const schemas = await pool.query('SELECT schema_name FROM information_schema.schemata ORDER BY schema_name');
    schemas.rows.forEach(row => console.log(`  - ${row.schema_name}`));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkSchema();
const { Pool } = require('pg');
require('dotenv').config();

const renderPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixVectorColumns() {
  console.log('🔧 Converting TEXT vector columns to proper vector(1536) types...\n');
  
  try {
    // Fix story_embedding in clients table
    console.log('📝 Updating clients.story_embedding column...');
    await renderPool.query(`
      ALTER TABLE client_mgmt.clients 
      ALTER COLUMN story_embedding TYPE vector(1536) USING story_embedding::vector
    `);
    console.log('✅ clients.story_embedding updated to vector(1536)');
    
    // Check if there are other vector columns that need fixing
    console.log('\n🔍 Checking for other vector columns...');
    const vectorColumns = await renderPool.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'client_mgmt' 
      AND (column_name LIKE '%embedding%' OR column_name LIKE '%vector%')
    `);
    
    console.log('Vector-related columns found:');
    vectorColumns.rows.forEach(row => {
      console.log(`  ${row.table_name}.${row.column_name}: ${row.data_type}`);
    });
    
    console.log('\n✅ Vector column conversion completed!');
    
  } catch (error) {
    console.error('❌ Error fixing vector columns:', error.message);
  } finally {
    await renderPool.end();
  }
}

fixVectorColumns().catch(console.error);
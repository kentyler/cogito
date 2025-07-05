const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

// Direct connection to Supabase PostgreSQL
const supabasePool = new Pool({
  connectionString: 'postgresql://user:password@host/database',
  ssl: { rejectUnauthorized: false }
});

// Render PostgreSQL connection
const renderPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const missingTables = [
  'clients',
  'participants', 
  'topics',
  'user_sessions',
  'client_invitations', 
  'participant_invitations'
];

async function exportTablesFromSupabase() {
  console.log('🚀 Connecting directly to Supabase PostgreSQL...\n');
  
  // First, check what schemas exist in Supabase
  try {
    console.log('📋 Checking schemas in Supabase...');
    const schemas = await supabasePool.query('SELECT schema_name FROM information_schema.schemata ORDER BY schema_name');
    console.log('Available schemas:', schemas.rows.map(r => r.schema_name));
    
    // Check what tables exist in client_mgmt schema
    console.log('\n📋 Tables in client_mgmt schema in Supabase:');
    const tables = await supabasePool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'client_mgmt'
      ORDER BY table_name
    `);
    
    if (tables.rows.length === 0) {
      console.log('❌ No tables found in client_mgmt schema in Supabase!');
      
      // Let's see if they're in a different schema
      for (const tableName of missingTables) {
        const searchResult = await supabasePool.query(`
          SELECT table_schema, table_name 
          FROM information_schema.tables 
          WHERE table_name = $1
        `, [tableName]);
        
        if (searchResult.rows.length > 0) {
          console.log(`Found ${tableName} in:`, searchResult.rows.map(r => `${r.table_schema}.${r.table_name}`));
        } else {
          console.log(`❌ ${tableName} not found anywhere in Supabase`);
        }
      }
    } else {
      console.log('Found tables:', tables.rows.map(r => r.table_name));
      
      // Export each table
      for (const table of tables.rows) {
        await exportTable(table.table_name, 'client_mgmt');
      }
    }
    
  } catch (error) {
    console.error('❌ Error connecting to Supabase:', error.message);
  } finally {
    await supabasePool.end();
    await renderPool.end();
  }
}

async function exportTable(tableName, schema = 'client_mgmt') {
  try {
    console.log(`\n📥 Exporting ${schema}.${tableName}...`);
    
    // Get table structure
    const structure = await supabasePool.query(`
      SELECT column_name, data_type, is_nullable, column_default, character_maximum_length
      FROM information_schema.columns 
      WHERE table_schema = $1 AND table_name = $2
      ORDER BY ordinal_position
    `, [schema, tableName]);
    
    console.log(`  📋 Structure (${structure.rows.length} columns):`);
    structure.rows.forEach(col => {
      console.log(`    ${col.column_name}: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
    });
    
    // Get data
    const data = await supabasePool.query(`SELECT * FROM ${schema}.${tableName}`);
    console.log(`  📊 Data: ${data.rows.length} rows`);
    
    // Save structure and data
    const exportData = {
      schema: schema,
      table: tableName,
      structure: structure.rows,
      data: data.rows
    };
    
    const filename = `export_${schema}_${tableName}.json`;
    fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
    console.log(`  💾 Saved to ${filename}`);
    
    if (data.rows.length > 0) {
      console.log(`  📄 Sample row:`, JSON.stringify(data.rows[0], null, 2));
    }
    
  } catch (error) {
    console.error(`  ❌ Error exporting ${tableName}:`, error.message);
  }
}

exportTablesFromSupabase().catch(console.error);
const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

// Supabase connection
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

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

async function exportAndImportTables() {
  console.log('🚀 Starting export/import process...\n');
  
  for (const tableName of missingTables) {
    try {
      console.log(`📥 Exporting ${tableName} from Supabase...`);
      
      // Export schema (structure)
      console.log(`  - Getting schema for ${tableName}...`);
      const { data: schemaData, error: schemaError } = await supabase.rpc('get_table_schema', {
        table_name: tableName,
        schema_name: 'client_mgmt'
      });
      
      if (schemaError) {
        console.log(`  ⚠️  Could not get schema via RPC, will use direct SQL query...`);
      }
      
      // Export data
      console.log(`  - Getting data from ${tableName}...`);
      const { data, error } = await supabase
        .from(tableName)
        .select('*');
      
      if (error) {
        console.error(`  ❌ Error fetching data from ${tableName}:`, error.message);
        continue;
      }
      
      console.log(`  ✅ Found ${data ? data.length : 0} rows in ${tableName}`);
      
      // Save data to file for backup
      const backupFile = `backup_${tableName}.json`;
      fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
      console.log(`  💾 Backed up to ${backupFile}`);
      
      // For now, let's just log what we found
      if (data && data.length > 0) {
        console.log(`  📋 Sample row:`, JSON.stringify(data[0], null, 2));
      }
      
    } catch (error) {
      console.error(`❌ Error processing ${tableName}:`, error.message);
    }
    
    console.log(''); // Empty line for readability
  }
  
  console.log('🏁 Export process complete. Check backup files for data.');
  console.log('\nNext steps:');
  console.log('1. We need to get the table schemas from Supabase');
  console.log('2. Create the tables in Render PostgreSQL');
  console.log('3. Import the data');
}

// Also check what's in the users table for reference
async function checkUsersTable() {
  try {
    console.log('🔍 Checking users table structure in Render...\n');
    const result = await renderPool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'client_mgmt' AND table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('Users table structure:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : ''} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });
    
  } catch (error) {
    console.error('Error checking users table:', error.message);
  }
}

async function main() {
  await checkUsersTable();
  await exportAndImportTables();
  await renderPool.end();
}

main().catch(console.error);
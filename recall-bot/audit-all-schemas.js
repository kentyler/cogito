const { Pool } = require('pg');
require('dotenv').config();

// Supabase connection
const supabasePool = new Pool({
  connectionString: 'postgresql://user:password@host/database',
  ssl: { rejectUnauthorized: false }
});

// Render connection
const renderPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const schemasToCheck = ['conversation', 'client_mgmt', 'events', 'files', 'kanban', 'meetings'];

async function auditAllSchemas() {
  console.log('🔍 COMPREHENSIVE SCHEMA AUDIT: Supabase vs Render\n');
  
  for (const schema of schemasToCheck) {
    console.log(`\n📋 === ${schema.toUpperCase()} SCHEMA ===`);
    
    try {
      // Get tables from Supabase
      console.log(`\n🔵 Supabase ${schema} tables:`);
      const supabaseTables = await supabasePool.query(`
        SELECT table_name, 
               (SELECT COUNT(*) FROM information_schema.columns 
                WHERE table_schema = $1 AND table_name = t.table_name) as column_count
        FROM information_schema.tables t
        WHERE table_schema = $1
        ORDER BY table_name
      `, [schema]);
      
      if (supabaseTables.rows.length === 0) {
        console.log(`  ❌ No tables found in ${schema} schema`);
      } else {
        supabaseTables.rows.forEach(row => {
          console.log(`  📄 ${row.table_name} (${row.column_count} columns)`);
        });
      }
      
      // Get tables from Render
      console.log(`\n🟡 Render ${schema} tables:`);
      const renderTables = await renderPool.query(`
        SELECT table_name, 
               (SELECT COUNT(*) FROM information_schema.columns 
                WHERE table_schema = $1 AND table_name = t.table_name) as column_count
        FROM information_schema.tables t
        WHERE table_schema = $1
        ORDER BY table_name
      `, [schema]);
      
      if (renderTables.rows.length === 0) {
        console.log(`  ❌ No tables found in ${schema} schema`);
      } else {
        renderTables.rows.forEach(row => {
          console.log(`  📄 ${row.table_name} (${row.column_count} columns)`);
        });
      }
      
      // Compare
      const supabaseTableNames = supabaseTables.rows.map(r => r.table_name);
      const renderTableNames = renderTables.rows.map(r => r.table_name);
      
      const missing = supabaseTableNames.filter(table => !renderTableNames.includes(table));
      const extra = renderTableNames.filter(table => !supabaseTableNames.includes(table));
      
      if (missing.length > 0) {
        console.log(`\n❌ MISSING from Render (${missing.length} tables):`);
        missing.forEach(table => console.log(`  - ${table}`));
      }
      
      if (extra.length > 0) {
        console.log(`\n➕ EXTRA in Render (${extra.length} tables):`);
        extra.forEach(table => console.log(`  - ${table}`));
      }
      
      if (missing.length === 0 && extra.length === 0) {
        console.log(`\n✅ ${schema} schema: FULLY SYNCHRONIZED`);
      } else {
        console.log(`\n⚠️  ${schema} schema: NEEDS SYNCHRONIZATION`);
      }
      
      // Get row counts for each table in Supabase
      if (supabaseTables.rows.length > 0) {
        console.log(`\n📊 Row counts in Supabase ${schema}:`);
        for (const table of supabaseTables.rows) {
          try {
            const count = await supabasePool.query(`SELECT COUNT(*) FROM ${schema}.${table.table_name}`);
            console.log(`  ${table.table_name}: ${count.rows[0].count} rows`);
          } catch (error) {
            console.log(`  ${table.table_name}: ERROR - ${error.message}`);
          }
        }
      }
      
    } catch (error) {
      console.error(`❌ Error checking ${schema} schema:`, error.message);
    }
  }
  
  console.log('\n🏁 AUDIT COMPLETE');
  console.log('\nRecommendation: Focus on schemas with missing tables for next migration phase.');
}

async function main() {
  try {
    await auditAllSchemas();
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await supabasePool.end();
    await renderPool.end();
  }
}

main().catch(console.error);
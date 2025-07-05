const { Pool } = require('pg');
const fs = require('fs');
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

async function getArrayColumnDetails(schemaName, tableName) {
  console.log(`🔍 Analyzing ARRAY columns in ${schemaName}.${tableName}...`);
  
  const result = await supabasePool.query(`
    SELECT column_name, data_type, udt_name
    FROM information_schema.columns 
    WHERE table_schema = $1 AND table_name = $2
    AND data_type = 'ARRAY'
    ORDER BY ordinal_position
  `, [schemaName, tableName]);
  
  console.log(`  Found ${result.rows.length} ARRAY columns:`);
  result.rows.forEach(col => {
    console.log(`    ${col.column_name}: ${col.data_type} (${col.udt_name})`);
  });
  
  return result.rows;
}

function generateCreateTableSQLWithArrays(schemaName, tableName, structure, constraints) {
  let sql = `CREATE TABLE ${schemaName}.${tableName} (\n`;
  
  const columns = structure.map(col => {
    let colDef = `  ${col.column_name} `;
    
    // Handle data types - including ARRAY types
    if (col.data_type === 'USER-DEFINED') {
      // Check if it's a vector or other custom type
      if (col.column_name.includes('embedding') || col.column_name.includes('vector')) {
        colDef += 'vector(1536)';
      } else {
        colDef += 'TEXT'; // Fallback for unknown custom types
      }
    } else if (col.data_type === 'ARRAY') {
      // Handle PostgreSQL arrays properly
      if (col.udt_name === '_text') {
        colDef += 'TEXT[]';
      } else if (col.udt_name === '_int4') {
        colDef += 'INTEGER[]';
      } else if (col.udt_name === '_int8') {
        colDef += 'BIGINT[]';
      } else if (col.udt_name === '_numeric') {
        colDef += 'NUMERIC[]';
      } else if (col.udt_name === '_float8') {
        colDef += 'DOUBLE PRECISION[]';
      } else {
        // Generic fallback
        colDef += 'TEXT[]';
      }
    } else if (col.data_type === 'character varying') {
      colDef += col.character_maximum_length ? `VARCHAR(${col.character_maximum_length})` : 'VARCHAR';
    } else if (col.data_type === 'timestamp with time zone') {
      colDef += 'TIMESTAMPTZ';
    } else if (col.data_type === 'timestamp without time zone') {
      colDef += 'TIMESTAMP';
    } else if (col.data_type === 'double precision') {
      colDef += 'DOUBLE PRECISION';
    } else {
      colDef += col.data_type.toUpperCase();
    }
    
    // Handle NOT NULL
    if (col.is_nullable === 'NO') {
      colDef += ' NOT NULL';
    }
    
    // Handle defaults
    if (col.column_default) {
      if (col.column_default.includes('nextval')) {
        // Serial column
        if (col.data_type === 'bigint') {
          colDef = `  ${col.column_name} BIGSERIAL`;
        } else {
          colDef = `  ${col.column_name} SERIAL`;
        }
        if (col.is_nullable === 'NO') {
          colDef += ' NOT NULL';
        }
      } else if (col.column_default === "'{}'::text[]") {
        colDef += " DEFAULT '{}'";
      } else if (col.column_default === "'{}'" || col.column_default.includes('ARRAY')) {
        colDef += " DEFAULT '{}'";
      } else {
        colDef += ` DEFAULT ${col.column_default}`;
      }
    }
    
    return colDef;
  });
  
  sql += columns.join(',\n');
  
  // Add primary key if found in constraints
  const pkConstraint = constraints.find(c => c.contype === 'p');
  if (pkConstraint) {
    sql += `,\n  ${pkConstraint.definition}`;
  }
  
  sql += '\n)';
  
  return sql;
}

async function fixArrayTables() {
  console.log('🔧 FIXING ARRAY COLUMN TABLES\n');
  
  const arrayTables = [
    { schema: 'conversation', table: 'pattern_types' },
    { schema: 'conversation', table: 'analytical_insights' },
    { schema: 'conversation', table: 'concept_connections' },
    { schema: 'conversation', table: 'thinking_processes' }
  ];
  
  // Load existing export data
  const schemaExport = JSON.parse(fs.readFileSync('migration_export_conversation.json', 'utf8'));
  
  for (const { schema, table } of arrayTables) {
    try {
      console.log(`\n🛠️  Fixing ${schema}.${table}...`);
      
      // Get array column details from Supabase
      await getArrayColumnDetails(schema, table);
      
      const tableData = schemaExport.tables[table];
      if (!tableData || tableData.error) {
        console.log(`  ⚠️  No data for ${table}`);
        continue;
      }
      
      // Get enhanced structure with array info
      const enhancedStructure = await supabasePool.query(`
        SELECT column_name, data_type, is_nullable, column_default, 
               character_maximum_length, udt_name
        FROM information_schema.columns 
        WHERE table_schema = $1 AND table_name = $2
        ORDER BY ordinal_position
      `, [schema, table]);
      
      // Drop existing table
      await renderPool.query(`DROP TABLE IF EXISTS ${schema}.${table} CASCADE`);
      
      // Create with proper array handling
      const createSQL = generateCreateTableSQLWithArrays(schema, table, enhancedStructure.rows, tableData.constraints);
      console.log(`  📝 Creating table with proper ARRAY syntax...`);
      
      await renderPool.query(createSQL);
      console.log(`  ✅ Table created successfully`);
      
      // Import data if any
      if (tableData.data && tableData.data.length > 0) {
        console.log(`  📊 Importing ${tableData.data.length} rows...`);
        
        let successCount = 0;
        for (const row of tableData.data) {
          try {
            const columns = Object.keys(row).filter(col => row[col] !== undefined);
            const values = columns.map(col => {
              // Handle vector columns
              if (col.includes('embedding') && row[col] !== null && typeof row[col] === 'object') {
                return JSON.stringify(row[col]);
              }
              // Handle array columns - ensure they're properly formatted
              if (Array.isArray(row[col])) {
                return row[col];
              }
              return row[col];
            });
            
            const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
            const insertSQL = `
              INSERT INTO ${schema}.${table} (${columns.join(', ')})
              VALUES (${placeholders})
            `;
            
            await renderPool.query(insertSQL, values);
            successCount++;
          } catch (insertError) {
            console.log(`    ⚠️  Row failed: ${insertError.message.substring(0, 100)}...`);
            
            // Try without ID for serial columns
            try {
              const filteredColumns = Object.keys(row).filter(col => col !== 'id' && row[col] !== undefined);
              const filteredValues = filteredColumns.map(col => {
                if (col.includes('embedding') && row[col] !== null && typeof row[col] === 'object') {
                  return JSON.stringify(row[col]);
                }
                if (Array.isArray(row[col])) {
                  return row[col];
                }
                return row[col];
              });
              
              const retryPlaceholders = filteredValues.map((_, i) => `$${i + 1}`).join(', ');
              const retrySQL = `
                INSERT INTO ${schema}.${table} (${filteredColumns.join(', ')})
                VALUES (${retryPlaceholders})
              `;
              
              await renderPool.query(retrySQL, filteredValues);
              successCount++;
            } catch (retryError) {
              console.log(`    ❌ Row retry failed: ${retryError.message.substring(0, 100)}...`);
            }
          }
        }
        
        console.log(`  ✅ Imported ${successCount}/${tableData.data.length} rows`);
      } else {
        console.log(`  📝 No data to import (empty table)`);
      }
      
    } catch (error) {
      console.error(`  ❌ Error fixing ${table}:`, error.message);
    }
  }
  
  // Final verification
  console.log(`\n🔍 Final verification of conversation schema...`);
  const finalTables = await renderPool.query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'conversation' ORDER BY table_name
  `);
  
  console.log(`✅ conversation schema now has ${finalTables.rows.length} tables:`);
  let totalRows = 0;
  for (const table of finalTables.rows) {
    const count = await renderPool.query(`SELECT COUNT(*) FROM conversation.${table.table_name}`);
    const rowCount = parseInt(count.rows[0].count);
    totalRows += rowCount;
    console.log(`  ${table.table_name}: ${rowCount} rows`);
  }
  
  console.log(`\n📊 Total conversation data: ${totalRows} rows`);
}

async function main() {
  try {
    await fixArrayTables();
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await supabasePool.end();
    await renderPool.end();
  }
}

main().catch(console.error);
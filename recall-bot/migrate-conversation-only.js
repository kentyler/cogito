const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

// Render connection
const renderPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

function generateCreateTableSQL(schemaName, tableName, structure, constraints) {
  let sql = `CREATE TABLE ${schemaName}.${tableName} (\n`;
  
  const columns = structure.map(col => {
    let colDef = `  ${col.column_name} `;
    
    // Handle data types
    if (col.data_type === 'USER-DEFINED') {
      // Assume vector for now
      colDef += 'vector(1536)';
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

async function importConversationSchema() {
  console.log('🚀 IMPORTING CONVERSATION SCHEMA TO RENDER\n');
  
  try {
    // Load the exported data
    if (!fs.existsSync('migration_export_conversation.json')) {
      throw new Error('Export file not found. Run --dry-run first.');
    }
    
    const schemaExport = JSON.parse(fs.readFileSync('migration_export_conversation.json', 'utf8'));
    console.log(`📁 Loaded export with ${Object.keys(schemaExport.tables).length} tables`);
    
    // Ensure schema exists
    await renderPool.query(`CREATE SCHEMA IF NOT EXISTS conversation`);
    
    let totalImported = 0;
    
    // Import tables in dependency order (avoid foreign key issues)
    const importOrder = [
      'pattern_types',
      'personalities', 
      'personality_evolutions',
      'lens_prototypes',
      'analytical_insights',
      'block_lens_version',
      'concept_connections',
      'detected_patterns',
      'participant_connections',
      'participant_llms',
      'participant_patterns',
      'thinking_processes'
    ];
    
    for (const tableName of importOrder) {
      const tableData = schemaExport.tables[tableName];
      
      if (!tableData || tableData.error) {
        console.log(`⚠️  Skipping ${tableName} - not in export or has errors`);
        continue;
      }
      
      try {
        console.log(`\n🏗️  Creating conversation.${tableName}...`);
        
        // Drop table if exists
        await renderPool.query(`DROP TABLE IF EXISTS conversation.${tableName} CASCADE`);
        
        // Generate CREATE TABLE statement
        const createSQL = generateCreateTableSQL('conversation', tableName, tableData.structure, tableData.constraints);
        console.log(`  📝 SQL preview: CREATE TABLE conversation.${tableName} (${tableData.structure.length} columns)`);
        
        await renderPool.query(createSQL);
        console.log(`  ✅ Table created`);
        
        // Import data
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
                return row[col];
              });
              
              const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
              const insertSQL = `
                INSERT INTO conversation.${tableName} (${columns.join(', ')})
                VALUES (${placeholders})
              `;
              
              await renderPool.query(insertSQL, values);
              successCount++;
            } catch (insertError) {
              // Try without ID for serial columns
              if (insertError.message.includes('duplicate key') || insertError.message.includes('violates')) {
                try {
                  const filteredColumns = Object.keys(row).filter(col => col !== 'id' && row[col] !== undefined);
                  const filteredValues = filteredColumns.map(col => {
                    if (col.includes('embedding') && row[col] !== null && typeof row[col] === 'object') {
                      return JSON.stringify(row[col]);
                    }
                    return row[col];
                  });
                  
                  const retryPlaceholders = filteredValues.map((_, i) => `$${i + 1}`).join(', ');
                  const retrySQL = `
                    INSERT INTO conversation.${tableName} (${filteredColumns.join(', ')})
                    VALUES (${retryPlaceholders})
                  `;
                  
                  await renderPool.query(retrySQL, filteredValues);
                  successCount++;
                } catch (retryError) {
                  console.log(`    ⚠️  Row failed: ${retryError.message.substring(0, 80)}...`);
                }
              } else {
                console.log(`    ⚠️  Row failed: ${insertError.message.substring(0, 80)}...`);
              }
            }
          }
          
          console.log(`  ✅ Imported ${successCount}/${tableData.data.length} rows`);
          totalImported += successCount;
        } else {
          console.log(`  📝 No data to import (empty table)`);
        }
        
      } catch (error) {
        console.error(`  ❌ Error importing ${tableName}:`, error.message);
      }
    }
    
    console.log(`\n📊 Conversation schema import complete: ${totalImported} total rows imported`);
    
    // Verify final state
    console.log(`\n🔍 Verification...`);
    const finalTables = await renderPool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'conversation' ORDER BY table_name
    `);
    
    console.log(`✅ conversation schema now has ${finalTables.rows.length} tables:`);
    for (const table of finalTables.rows) {
      const count = await renderPool.query(`SELECT COUNT(*) FROM conversation.${table.table_name}`);
      console.log(`  ${table.table_name}: ${count.rows[0].count} rows`);
    }
    
  } catch (error) {
    console.error('❌ Import error:', error);
  } finally {
    await renderPool.end();
  }
}

importConversationSchema().catch(console.error);
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

const remainingSchemas = {
  events: [
    'participant_event_categories',
    'participant_event_logs', 
    'participant_event_types',
    'participant_events'
  ],
  files: [
    'file_types',
    'file_upload_vectors',
    'file_uploads'
  ],
  kanban: [
    'kanban_boards',
    'kanban_columns',
    'kanban_games', 
    'kanban_moves',
    'kanban_snapshots',
    'kanban_tasks'
  ],
  meetings: [
    'block_attendees',
    'block_meetings'
  ]
};

function generateCreateTableSQLWithArrays(schemaName, tableName, structure, constraints) {
  let sql = `CREATE TABLE ${schemaName}.${tableName} (\n`;
  
  const columns = structure.map(col => {
    let colDef = `  ${col.column_name} `;
    
    // Handle data types - including ARRAY types
    if (col.data_type === 'USER-DEFINED') {
      if (col.column_name.includes('embedding') || col.column_name.includes('vector')) {
        colDef += 'vector(1536)';
      } else {
        colDef += 'TEXT';
      }
    } else if (col.data_type === 'ARRAY') {
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
        if (col.data_type === 'bigint') {
          colDef = `  ${col.column_name} BIGSERIAL`;
        } else {
          colDef = `  ${col.column_name} SERIAL`;
        }
        if (col.is_nullable === 'NO') {
          colDef += ' NOT NULL';
        }
      } else if (col.column_default === "'{}'::text[]" || col.column_default === "'{}'" || col.column_default.includes('ARRAY')) {
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

async function exportAndImportSchema(schemaName, tables) {
  console.log(`\n📥 === MIGRATING ${schemaName.toUpperCase()} SCHEMA ===`);
  
  try {
    // Ensure schema exists in Render
    await renderPool.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
    
    let totalImported = 0;
    
    for (const tableName of tables) {
      try {
        console.log(`\n📋 Processing ${schemaName}.${tableName}...`);
        
        // Get table structure from Supabase
        const structure = await supabasePool.query(`
          SELECT column_name, data_type, is_nullable, column_default, 
                 character_maximum_length, udt_name
          FROM information_schema.columns 
          WHERE table_schema = $1 AND table_name = $2
          ORDER BY ordinal_position
        `, [schemaName, tableName]);
        
        if (structure.rows.length === 0) {
          console.log(`  ⚠️  Table ${tableName} not found in ${schemaName}`);
          continue;
        }
        
        // Get constraints
        const constraints = await supabasePool.query(`
          SELECT conname, contype, pg_get_constraintdef(oid) as definition
          FROM pg_constraint 
          WHERE conrelid = (
            SELECT oid FROM pg_class 
            WHERE relname = $1 AND relnamespace = (
              SELECT oid FROM pg_namespace WHERE nspname = $2
            )
          )
        `, [tableName, schemaName]);
        
        // Get data
        const data = await supabasePool.query(`SELECT * FROM ${schemaName}.${tableName}`);
        console.log(`  📊 Structure: ${structure.rows.length} columns, Data: ${data.rows.length} rows`);
        
        // Drop existing table in Render
        await renderPool.query(`DROP TABLE IF EXISTS ${schemaName}.${tableName} CASCADE`);
        
        // Create table in Render
        const createSQL = generateCreateTableSQLWithArrays(schemaName, tableName, structure.rows, constraints.rows);
        await renderPool.query(createSQL);
        console.log(`  ✅ Table created`);
        
        // Import data
        if (data.rows.length > 0) {
          console.log(`  📦 Importing ${data.rows.length} rows...`);
          
          let successCount = 0;
          for (const row of data.rows) {
            try {
              const columns = Object.keys(row).filter(col => row[col] !== undefined);
              const values = columns.map(col => {
                if (col.includes('embedding') && row[col] !== null && typeof row[col] === 'object') {
                  return JSON.stringify(row[col]);
                }
                if (Array.isArray(row[col])) {
                  return row[col];
                }
                return row[col];
              });
              
              const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
              const insertSQL = `
                INSERT INTO ${schemaName}.${tableName} (${columns.join(', ')})
                VALUES (${placeholders})
              `;
              
              await renderPool.query(insertSQL, values);
              successCount++;
            } catch (insertError) {
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
                  INSERT INTO ${schemaName}.${tableName} (${filteredColumns.join(', ')})
                  VALUES (${retryPlaceholders})
                `;
                
                await renderPool.query(retrySQL, filteredValues);
                successCount++;
              } catch (retryError) {
                console.log(`    ⚠️  Row failed: ${retryError.message.substring(0, 80)}...`);
              }
            }
          }
          
          console.log(`  ✅ Imported ${successCount}/${data.rows.length} rows`);
          totalImported += successCount;
        } else {
          console.log(`  📝 No data to import (empty table)`);
        }
        
      } catch (error) {
        console.error(`  ❌ Error processing ${tableName}:`, error.message);
      }
    }
    
    console.log(`\n📊 ${schemaName} schema complete: ${totalImported} rows imported`);
    
    // Verify what we have
    const finalTables = await renderPool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = $1 ORDER BY table_name
    `, [schemaName]);
    
    console.log(`✅ ${schemaName} schema now has ${finalTables.rows.length} tables:`);
    for (const table of finalTables.rows) {
      const count = await renderPool.query(`SELECT COUNT(*) FROM ${schemaName}.${table.table_name}`);
      console.log(`  ${table.table_name}: ${count.rows[0].count} rows`);
    }
    
  } catch (error) {
    console.error(`❌ Error migrating ${schemaName} schema:`, error.message);
  }
}

async function migrateRemainingSchemas() {
  console.log('🚀 MIGRATING REMAINING SCHEMAS TO RENDER\n');
  
  try {
    for (const [schemaName, tables] of Object.entries(remainingSchemas)) {
      await exportAndImportSchema(schemaName, tables);
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ ALL SCHEMA MIGRATIONS COMPLETE!');
    console.log('='.repeat(70));
    
    // Final summary
    console.log('\n📊 FINAL MIGRATION SUMMARY:');
    const allSchemas = ['client_mgmt', 'conversation', 'events', 'files', 'kanban', 'meetings'];
    
    let grandTotal = 0;
    for (const schema of allSchemas) {
      try {
        const tables = await renderPool.query(`
          SELECT table_name FROM information_schema.tables 
          WHERE table_schema = $1
        `, [schema]);
        
        let schemaTotal = 0;
        for (const table of tables.rows) {
          const count = await renderPool.query(`SELECT COUNT(*) FROM ${schema}.${table.table_name}`);
          schemaTotal += parseInt(count.rows[0].count);
        }
        
        console.log(`  ${schema}: ${tables.rows.length} tables, ${schemaTotal} rows`);
        grandTotal += schemaTotal;
      } catch (error) {
        console.log(`  ${schema}: ERROR - ${error.message}`);
      }
    }
    
    console.log(`\n🎉 TOTAL DATA MIGRATED: ${grandTotal} rows across all schemas`);
    
  } catch (error) {
    console.error('❌ Fatal migration error:', error);
  } finally {
    await supabasePool.end();
    await renderPool.end();
  }
}

migrateRemainingSchemas().catch(console.error);
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

// Define what tables need to be migrated for each schema
const migrationPlan = {
  conversation: {
    priority: 1, // Highest priority - has most data
    missing: [
      'analytical_insights',
      'block_lens_version', 
      'concept_connections',
      'detected_patterns',
      'lens_prototypes',
      'participant_connections',
      'participant_llms',
      'participant_patterns',
      'pattern_types',
      'personalities',
      'personality_evolutions',
      'thinking_processes'
    ]
  },
  events: {
    priority: 2,
    missing: [
      'participant_event_categories',
      'participant_event_logs', 
      'participant_event_types',
      'participant_events'
    ]
  },
  files: {
    priority: 3,
    missing: [
      'file_types',
      'file_upload_vectors',
      'file_uploads'
    ]
  },
  kanban: {
    priority: 4,
    missing: [
      'kanban_boards',
      'kanban_columns',
      'kanban_games', 
      'kanban_moves',
      'kanban_snapshots',
      'kanban_tasks'
    ]
  },
  meetings: {
    priority: 5,
    missing: [
      'block_attendees',
      'block_meetings'
    ]
  }
};

async function exportSchema(schemaName, tables) {
  console.log(`\n📥 === EXPORTING ${schemaName.toUpperCase()} SCHEMA ===`);
  
  const schemaExport = {
    schema: schemaName,
    tables: {},
    exported_at: new Date().toISOString()
  };
  
  let totalRows = 0;
  
  for (const tableName of tables) {
    try {
      console.log(`\n📋 Exporting ${schemaName}.${tableName}...`);
      
      // Get table structure
      const structure = await supabasePool.query(`
        SELECT column_name, data_type, is_nullable, column_default, character_maximum_length,
               numeric_precision, numeric_scale
        FROM information_schema.columns 
        WHERE table_schema = $1 AND table_name = $2
        ORDER BY ordinal_position
      `, [schemaName, tableName]);
      
      if (structure.rows.length === 0) {
        console.log(`  ⚠️  Table ${tableName} not found in ${schemaName} schema`);
        continue;
      }
      
      console.log(`  📊 Structure: ${structure.rows.length} columns`);
      
      // Get constraints and indexes
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
      console.log(`  📦 Data: ${data.rows.length} rows`);
      totalRows += data.rows.length;
      
      // Store in export object
      schemaExport.tables[tableName] = {
        structure: structure.rows,
        constraints: constraints.rows,
        data: data.rows,
        row_count: data.rows.length
      };
      
      if (data.rows.length > 0) {
        console.log(`  📄 Sample row keys:`, Object.keys(data.rows[0]).slice(0, 5).join(', '));
      }
      
    } catch (error) {
      console.error(`  ❌ Error exporting ${tableName}:`, error.message);
      schemaExport.tables[tableName] = {
        error: error.message,
        exported: false
      };
    }
  }
  
  // Save schema export to file
  const filename = `migration_export_${schemaName}.json`;
  fs.writeFileSync(filename, JSON.stringify(schemaExport, null, 2));
  console.log(`\n💾 Saved ${schemaName} schema export to ${filename}`);
  console.log(`📊 Total rows exported: ${totalRows}`);
  
  return schemaExport;
}

async function importSchema(schemaExport) {
  const schemaName = schemaExport.schema;
  console.log(`\n📤 === IMPORTING ${schemaName.toUpperCase()} SCHEMA ===`);
  
  // Ensure schema exists
  await renderPool.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
  
  let totalImported = 0;
  
  for (const [tableName, tableData] of Object.entries(schemaExport.tables)) {
    if (tableData.error || !tableData.structure) {
      console.log(`\n⚠️  Skipping ${tableName} - export failed`);
      continue;
    }
    
    try {
      console.log(`\n🏗️  Creating ${schemaName}.${tableName}...`);
      
      // Drop table if exists
      await renderPool.query(`DROP TABLE IF EXISTS ${schemaName}.${tableName} CASCADE`);
      
      // Generate CREATE TABLE statement
      const createSQL = generateCreateTableSQL(schemaName, tableName, tableData.structure, tableData.constraints);
      await renderPool.query(createSQL);
      
      console.log(`  ✅ Table created with ${tableData.structure.length} columns`);
      
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
              INSERT INTO ${schemaName}.${tableName} (${columns.join(', ')})
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
                  INSERT INTO ${schemaName}.${tableName} (${filteredColumns.join(', ')})
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
      }
      
    } catch (error) {
      console.error(`  ❌ Error importing ${tableName}:`, error.message);
    }
  }
  
  console.log(`\n📊 ${schemaName} schema import complete: ${totalImported} total rows imported`);
}

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

async function runComprehensiveMigration() {
  console.log('🚀 COMPREHENSIVE MIGRATION: Supabase → Render PostgreSQL');
  console.log('='.repeat(70));
  
  try {
    // Sort schemas by priority
    const sortedSchemas = Object.entries(migrationPlan)
      .sort(([,a], [,b]) => a.priority - b.priority)
      .map(([name, config]) => ({ name, ...config }));
    
    console.log('\n📋 Migration Plan:');
    sortedSchemas.forEach(schema => {
      console.log(`  ${schema.priority}. ${schema.name}: ${schema.missing.length} tables`);
    });
    
    // Export phase
    console.log('\n' + '='.repeat(70));
    console.log('🔽 EXPORT PHASE');
    console.log('='.repeat(70));
    
    const exports = {};
    for (const schema of sortedSchemas) {
      exports[schema.name] = await exportSchema(schema.name, schema.missing);
    }
    
    // Import phase
    console.log('\n' + '='.repeat(70));
    console.log('🔼 IMPORT PHASE');
    console.log('='.repeat(70));
    
    for (const schema of sortedSchemas) {
      await importSchema(exports[schema.name]);
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ MIGRATION COMPLETE!');
    console.log('='.repeat(70));
    
    // Final verification
    console.log('\n🔍 Final verification...');
    for (const schema of sortedSchemas) {
      const tables = await renderPool.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = $1 ORDER BY table_name
      `, [schema.name]);
      
      console.log(`${schema.name}: ${tables.rows.length} tables`);
    }
    
  } catch (error) {
    console.error('❌ Fatal migration error:', error);
  } finally {
    await supabasePool.end();
    await renderPool.end();
  }
}

// Check if this is a dry run
const isDryRun = process.argv.includes('--dry-run');

async function runDryRun() {
  console.log('🧪 DRY RUN MODE - Only exporting, not importing\n');
  
  try {
    const sortedSchemas = Object.entries(migrationPlan)
      .sort(([,a], [,b]) => a.priority - b.priority)
      .map(([name, config]) => ({ name, ...config }));
    
    console.log('📋 Export Plan:');
    sortedSchemas.forEach(schema => {
      console.log(`  ${schema.priority}. ${schema.name}: ${schema.missing.length} tables`);
    });
    
    // Export only the conversation schema first (highest priority)
    const conversationSchema = sortedSchemas.find(s => s.name === 'conversation');
    if (conversationSchema) {
      await exportSchema(conversationSchema.name, conversationSchema.missing);
    }
    
  } catch (error) {
    console.error('❌ Dry run error:', error);
  } finally {
    await supabasePool.end();
    await renderPool.end();
  }
}

if (isDryRun) {
  runDryRun().catch(console.error);
} else {
  runComprehensiveMigration().catch(console.error);
}
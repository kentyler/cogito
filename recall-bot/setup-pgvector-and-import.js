const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

// Render PostgreSQL connection
const renderPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function setupPgVectorAndImport() {
  console.log('🚀 Setting up pgvector extension and importing tables...\n');
  
  try {
    // First, try to enable pgvector extension
    console.log('🔧 Enabling pgvector extension...');
    try {
      await renderPool.query('CREATE EXTENSION IF NOT EXISTS vector');
      console.log('✅ pgvector extension enabled');
    } catch (vectorError) {
      console.log('⚠️  pgvector extension not available, using TEXT for vector columns');
      console.log('   Vector columns will be stored as TEXT for now');
    }
    
    // Check what tables already exist
    const existingTables = await renderPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'client_mgmt'
    `);
    
    const existing = existingTables.rows.map(r => r.table_name);
    console.log('📋 Existing tables in client_mgmt:', existing);
    
    // Create tables without vector for now
    const createTableSQL = {
      'clients': `
        CREATE TABLE client_mgmt.clients (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          current_llm_id BIGINT,
          metadata JSONB DEFAULT '{}',
          story TEXT,
          story_embedding TEXT -- Will be vector(1536) when pgvector is available
        )
      `,
      'client_prompts': `
        CREATE TABLE client_mgmt.client_prompts (
          id SERIAL PRIMARY KEY,
          client_id INTEGER NOT NULL,
          prompt_text TEXT NOT NULL,
          label_text VARCHAR(100) NOT NULL,
          display_order DOUBLE PRECISION NOT NULL,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          instructions TEXT
        )
      `,
      'llm_types': `
        CREATE TABLE client_mgmt.llm_types (
          id SERIAL PRIMARY KEY,
          name VARCHAR(50) NOT NULL,
          description TEXT,
          api_handler VARCHAR(100) NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          client_id INTEGER NOT NULL
        )
      `,
      'llms': `
        CREATE TABLE client_mgmt.llms (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          provider VARCHAR(255) NOT NULL,
          model VARCHAR(255) NOT NULL,
          api_key TEXT NOT NULL,
          temperature DOUBLE PRECISION DEFAULT 0.7,
          max_tokens INTEGER DEFAULT 1000,
          type_id INTEGER,
          additional_config JSONB,
          subdomain VARCHAR(255) NOT NULL DEFAULT 'public',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          client_id INTEGER NOT NULL
        )
      `,
      'client_llms': `
        CREATE TABLE client_mgmt.client_llms (
          id SERIAL PRIMARY KEY,
          client_id BIGINT NOT NULL,
          llm_id BIGINT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(client_id, llm_id)
        )
      `,
      'participant_invitations': `
        CREATE TABLE client_mgmt.participant_invitations (
          id BIGSERIAL PRIMARY KEY,
          invited_by BIGINT,
          email TEXT NOT NULL,
          client_id INTEGER NOT NULL,
          invitation_token TEXT NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          accepted_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          invited_to_role TEXT,
          personal_message TEXT,
          status VARCHAR(20) DEFAULT 'pending'
        )
      `
    };
    
    const exportFiles = [
      'export_client_mgmt_clients.json',
      'export_client_mgmt_client_prompts.json', 
      'export_client_mgmt_llm_types.json',
      'export_client_mgmt_llms.json',
      'export_client_mgmt_client_llms.json',
      'export_client_mgmt_participant_invitations.json'
    ];
    
    for (const filename of exportFiles) {
      if (!fs.existsSync(filename)) {
        console.log(`⚠️  Skipping ${filename} - file not found`);
        continue;
      }
      
      const exportData = JSON.parse(fs.readFileSync(filename, 'utf8'));
      const tableName = exportData.table;
      
      console.log(`\n📥 Processing ${tableName}...`);
      
      // Drop table if it exists
      if (existing.includes(tableName)) {
        console.log(`   🗑️  Dropping existing ${tableName} table...`);
        await renderPool.query(`DROP TABLE IF EXISTS client_mgmt.${tableName} CASCADE`);
      }
      
      // Create table
      if (createTableSQL[tableName]) {
        console.log(`   🏗️  Creating ${tableName} table...`);
        await renderPool.query(createTableSQL[tableName]);
        
        // Import data if any exists
        if (exportData.data.length > 0) {
          console.log(`   📊 Importing ${exportData.data.length} rows...`);
          
          for (const row of exportData.data) {
            const columns = Object.keys(row).filter(col => row[col] !== undefined);
            const values = columns.map(col => {
              // Handle vector columns - convert to string for now
              if (col.includes('embedding') && row[col] !== null) {
                return JSON.stringify(row[col]);
              }
              return row[col];
            });
            const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
            
            const insertSQL = `
              INSERT INTO client_mgmt.${tableName} (${columns.join(', ')})
              VALUES (${placeholders})
            `;
            
            try {
              await renderPool.query(insertSQL, values);
            } catch (insertError) {
              // Try without id column for SERIAL fields
              if (insertError.message.includes('duplicate key') || insertError.message.includes('violates') || insertError.message.includes('already exists')) {
                const filteredColumns = columns.filter(col => col !== 'id');
                const filteredValues = filteredColumns.map(col => {
                  if (col.includes('embedding') && row[col] !== null) {
                    return JSON.stringify(row[col]);
                  }
                  return row[col];
                });
                const filteredPlaceholders = filteredValues.map((_, i) => `$${i + 1}`).join(', ');
                
                const retrySQL = `
                  INSERT INTO client_mgmt.${tableName} (${filteredColumns.join(', ')})
                  VALUES (${filteredPlaceholders})
                `;
                
                try {
                  await renderPool.query(retrySQL, filteredValues);
                } catch (retryError) {
                  console.log(`     ⚠️  Row skipped: ${retryError.message.substring(0, 100)}...`);
                }
              } else {
                console.log(`     ⚠️  Row skipped: ${insertError.message.substring(0, 100)}...`);
              }
            }
          }
        }
        
        console.log(`   ✅ ${tableName} completed`);
      } else {
        console.log(`   ❌ No CREATE TABLE SQL defined for ${tableName}`);
      }
    }
    
    // Final verification
    console.log('\n📋 Final verification...');
    const finalTables = await renderPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'client_mgmt'
      ORDER BY table_name
    `);
    
    console.log('Tables now in client_mgmt:', finalTables.rows.map(r => r.table_name));
    
    // Check row counts
    for (const table of finalTables.rows) {
      const count = await renderPool.query(`SELECT COUNT(*) FROM client_mgmt.${table.table_name}`);
      console.log(`  ${table.table_name}: ${count.rows[0].count} rows`);
    }
    
    console.log('\n✅ Import completed successfully!');
    console.log('📝 Note: Vector columns are stored as TEXT. Install pgvector extension to use proper vector types.');
    
  } catch (error) {
    console.error('❌ Error during setup/import:', error.message);
  } finally {
    await renderPool.end();
  }
}

setupPgVectorAndImport().catch(console.error);
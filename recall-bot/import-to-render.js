const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

// Render PostgreSQL connection
const renderPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const exportFiles = [
  'export_client_mgmt_client_llms.json',
  'export_client_mgmt_client_prompts.json', 
  'export_client_mgmt_clients.json',
  'export_client_mgmt_llm_types.json',
  'export_client_mgmt_llms.json',
  'export_client_mgmt_participant_invitations.json',
  'export_client_mgmt_users.json'
];

// Table creation SQL mapping
const createTableSQL = {
  'clients': `
    CREATE TABLE client_mgmt.clients (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      current_llm_id BIGINT,
      metadata JSONB DEFAULT '{}',
      story TEXT,
      story_embedding vector(1536)
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
      name VARCHAR(50) NOT NULL UNIQUE,
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

async function importTables() {
  console.log('🚀 Starting import process to Render PostgreSQL...\n');
  
  try {
    // Check what tables already exist
    const existingTables = await renderPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'client_mgmt'
    `);
    
    const existing = existingTables.rows.map(r => r.table_name);
    console.log('📋 Existing tables in client_mgmt:', existing);
    
    for (const filename of exportFiles) {
      if (!fs.existsSync(filename)) {
        console.log(`⚠️  Skipping ${filename} - file not found`);
        continue;
      }
      
      const exportData = JSON.parse(fs.readFileSync(filename, 'utf8'));
      const tableName = exportData.table;
      
      console.log(`\n📥 Processing ${tableName}...`);
      console.log(`   Structure: ${exportData.structure.length} columns`);
      console.log(`   Data: ${exportData.data.length} rows`);
      
      // Skip users table since it exists and has different structure
      if (tableName === 'users') {
        console.log(`   ⚠️  Skipping users table - already exists with different structure`);
        continue;
      }
      
      // Drop table if it exists
      if (existing.includes(tableName)) {
        console.log(`   🗑️  Dropping existing ${tableName} table...`);
        await renderPool.query(`DROP TABLE IF EXISTS client_mgmt.${tableName} CASCADE`);
      }
      
      // Create table
      if (createTableSQL[tableName]) {
        console.log(`   🏗️  Creating ${tableName} table...`);
        await renderPool.query(createTableSQL[tableName]);
      } else {
        console.log(`   ❌ No CREATE TABLE SQL defined for ${tableName}`);
        continue;
      }
      
      // Import data if any exists
      if (exportData.data.length > 0) {
        console.log(`   📊 Importing ${exportData.data.length} rows...`);
        
        for (const row of exportData.data) {
          const columns = Object.keys(row);
          const values = Object.values(row);
          const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
          
          const insertSQL = `
            INSERT INTO client_mgmt.${tableName} (${columns.join(', ')})
            VALUES (${placeholders})
          `;
          
          try {
            await renderPool.query(insertSQL, values);
          } catch (insertError) {
            console.log(`     ⚠️  Error inserting row: ${insertError.message}`);
            // Try without id column for SERIAL fields
            if (insertError.message.includes('duplicate key') || insertError.message.includes('violates')) {
              const filteredColumns = columns.filter(col => col !== 'id');
              const filteredValues = values.filter((_, i) => columns[i] !== 'id');
              const filteredPlaceholders = filteredValues.map((_, i) => `$${i + 1}`).join(', ');
              
              const retrySQL = `
                INSERT INTO client_mgmt.${tableName} (${filteredColumns.join(', ')})
                VALUES (${filteredPlaceholders})
              `;
              
              try {
                await renderPool.query(retrySQL, filteredValues);
              } catch (retryError) {
                console.log(`     ❌ Retry failed: ${retryError.message}`);
              }
            }
          }
        }
      }
      
      console.log(`   ✅ ${tableName} completed`);
    }
    
    // Now check what we have
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
    
  } catch (error) {
    console.error('❌ Error during import:', error.message);
  } finally {
    await renderPool.end();
  }
}

importTables().catch(console.error);
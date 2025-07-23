const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../conversational-repl/.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runClientIdMigrations() {
  try {
    console.log('🚀 Starting client_id migrations...');
    
    // Check if we have at least one client
    const clientCheck = await pool.query('SELECT COUNT(*) as count FROM client_mgmt.clients');
    const clientCount = parseInt(clientCheck.rows[0].count);
    
    if (clientCount === 0) {
      console.log('⚠️  No clients found. Creating a default client...');
      await pool.query(`
        INSERT INTO client_mgmt.clients (name, metadata, story) 
        VALUES ('Default Client', '{}', 'Default client for existing data')
      `);
      console.log('✅ Default client created');
    } else {
      console.log(`📊 Found ${clientCount} existing clients`);
    }
    
    // Run migration 025: Add client_id to blocks
    console.log('📦 Running migration 025: Add client_id to blocks...');
    const migration025 = fs.readFileSync(path.join(__dirname, '025_add_client_id_to_blocks.sql'), 'utf8');
    await pool.query(migration025);
    console.log('✅ Migration 025 completed');
    
    // Run migration 026: Add foreign key to turns
    console.log('🔗 Running migration 026: Add client_id foreign key to turns...');
    const migration026 = fs.readFileSync(path.join(__dirname, '026_add_client_fk_to_turns.sql'), 'utf8');
    await pool.query(migration026);
    console.log('✅ Migration 026 completed');
    
    // Verify the changes
    console.log('🔍 Verifying migrations...');
    
    const blocksResult = await pool.query(`
      SELECT 
        column_name, 
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_schema = 'conversation' 
      AND table_name = 'blocks' 
      AND column_name = 'client_id'
    `);
    
    const turnsResult = await pool.query(`
      SELECT 
        constraint_name,
        constraint_type
      FROM information_schema.table_constraints 
      WHERE table_schema = 'conversation' 
      AND table_name IN ('blocks', 'turns')
      AND constraint_name LIKE '%client%'
    `);
    
    console.log('📋 Blocks client_id column:', blocksResult.rows);
    console.log('🔗 Client foreign key constraints:', turnsResult.rows);
    
    // Show updated counts
    const blockStats = await pool.query(`
      SELECT 
        COUNT(*) as total_blocks,
        COUNT(client_id) as blocks_with_client_id
      FROM conversation.blocks
    `);
    
    const turnStats = await pool.query(`
      SELECT 
        COUNT(*) as total_turns,
        COUNT(client_id) as turns_with_client_id
      FROM conversation.turns
    `);
    
    console.log('📊 Block statistics:', blockStats.rows[0]);
    console.log('📊 Turn statistics:', turnStats.rows[0]);
    
    console.log('🎉 All client_id migrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  runClientIdMigrations()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { runClientIdMigrations };
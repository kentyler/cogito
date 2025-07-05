import { DatabaseManager } from './lib/database.js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runBlocksMigration() {
  const db = new DatabaseManager();
  
  try {
    console.log('🔄 Starting blocks migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', '006_conversation_to_blocks_migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await db.pool.query(migrationSQL);
    
    console.log('✅ Blocks migration completed successfully!');
    
    // Test the migration by checking new tables
    console.log('\n📊 Checking new table structures...');
    
    const tables = ['turns', 'blocks', 'block_turns', 'lens_prototypes', 'block_lens_version'];
    for (const table of tables) {
      const result = await db.pool.query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`${table}: ${result.rows[0].count} records`);
    }
    
    // Check migration of data
    console.log('\n📈 Checking data migration...');
    const sessionBlocks = await db.pool.query('SELECT COUNT(*) as count FROM session_blocks');
    console.log(`Session blocks created: ${sessionBlocks.rows[0].count}`);
    
    const lensPrototypes = await db.pool.query('SELECT name FROM lens_prototypes ORDER BY name');
    console.log(`Lens prototypes: ${lensPrototypes.rows.map(r => r.name).join(', ')}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await db.close();
  }
}

runBlocksMigration();
import { DatabaseAgent } from '../database/database-agent.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigration() {
  const dbAgent = new DatabaseAgent();
  
  try {
    console.log('🔌 Connecting to database...');
    await dbAgent.connect();
    
    console.log('📄 Reading migration file...');
    const migrationSQL = await fs.readFile(
      path.join(__dirname, 'add_directed_to_turns.sql'), 
      'utf-8'
    );
    
    console.log('🚀 Running migration...');
    await dbAgent.connector.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('📊 Verifying new column...');
    
    // Verify the column was added
    const result = await dbAgent.connector.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'meetings' 
      AND table_name = 'turns' 
      AND column_name = 'directed_to'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Column verified:', result.rows[0]);
    } else {
      console.log('⚠️  Column not found after migration');
    }
    
    // Check if functions were created
    const funcResult = await dbAgent.connector.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'meetings' 
      AND routine_name IN ('get_turns_directed_to_user', 'update_turn_direction')
    `);
    
    console.log(`✅ Functions created: ${funcResult.rows.length}/2`);
    funcResult.rows.forEach(row => {
      console.log(`   - ${row.routine_name}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await dbAgent.disconnect();
    console.log('🔒 Database connection closed');
  }
}

runMigration();
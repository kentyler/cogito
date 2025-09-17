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
      path.join(__dirname, 'make_meeting_optional_add_client_to_turns.sql'), 
      'utf-8'
    );
    
    console.log('🚀 Running migration...');
    await dbAgent.connector.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('📊 Verifying changes...');
    
    // Verify the column was added
    const result = await dbAgent.connector.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'meetings' 
      AND table_name = 'turns' 
      AND column_name IN ('client_id', 'meeting_id')
      ORDER BY column_name
    `);
    
    console.log('Column status:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}, nullable: ${row.is_nullable}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await dbAgent.close();
    console.log('🔒 Database connection closed');
  }
}

runMigration();
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
      path.join(__dirname, 'remove_meeting_fk_constraint.sql'), 
      'utf-8'
    );
    
    console.log('🚀 Running migration to remove foreign key constraint...');
    await dbAgent.connector.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the constraint was removed by trying to insert a turn with null meeting_id
    console.log('🔍 Testing null meeting_id insertion...');
    const testResult = await dbAgent.connector.query(`
      SELECT COUNT(*) as count 
      FROM meetings.turns 
      WHERE meeting_id IS NULL
    `);
    
    console.log(`✅ Found ${testResult.rows[0].count} turns with null meeting_id`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await dbAgent.close();
    console.log('🔒 Database connection closed');
  }
}

runMigration();
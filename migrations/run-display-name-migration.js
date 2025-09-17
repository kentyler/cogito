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
      path.join(__dirname, 'add_display_name_to_users.sql'), 
      'utf-8'
    );
    
    console.log('🚀 Running migration...');
    await dbAgent.connector.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the column was added
    const result = await dbAgent.connector.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'client_mgmt' 
      AND table_name = 'users'
      AND column_name = 'display_name'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Column verified:', result.rows[0]);
      
      // Show some sample data
      const users = await dbAgent.connector.query(`
        SELECT id, email, display_name 
        FROM client_mgmt.users 
        LIMIT 5
      `);
      
      console.log('\nSample users with display names:');
      users.rows.forEach(user => {
        console.log(`  ID ${user.id}: ${user.display_name} (${user.email})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await dbAgent.close();
    console.log('🔒 Database connection closed');
  }
}

runMigration();
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('🔄 Starting meetings schema migration...');
    
    // Read the migration SQL
    const migrationPath = path.join(__dirname, '010_create_meetings_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Executing migration SQL...');
    
    // Execute the migration
    const result = await pool.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('📊 Final verification:');
    
    // Verify the schema move worked
    const verifyResult = await pool.query(`
      SELECT 
        schemaname, 
        tablename, 
        tableowner 
      FROM pg_tables 
      WHERE schemaname = 'meetings' 
      ORDER BY tablename
    `);
    
    console.log('Tables in meetings schema:');
    verifyResult.rows.forEach(row => {
      console.log(`  - ${row.schemaname}.${row.tablename} (owner: ${row.tableowner})`);
    });
    
    // Check if conversation schema still exists
    const schemaCheck = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name = 'conversation'
    `);
    
    if (schemaCheck.rows.length === 0) {
      console.log('✅ Conversation schema successfully removed');
    } else {
      console.log('⚠️  Conversation schema still exists');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('SQL Error details:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
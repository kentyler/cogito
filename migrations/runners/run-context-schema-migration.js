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
    console.log('🔄 Starting context schema migration...');
    
    // Read the migration SQL
    const migrationPath = path.join(__dirname, '011_create_context_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Executing migration SQL...');
    
    // Execute the migration
    const result = await pool.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('📊 Final verification:');
    
    // Verify the schema creation worked
    const verifyResult = await pool.query(`
      SELECT 
        schemaname, 
        tablename, 
        tableowner 
      FROM pg_tables 
      WHERE schemaname = 'context' 
      ORDER BY tablename
    `);
    
    console.log('Tables in context schema:');
    verifyResult.rows.forEach(row => {
      console.log(`  - ${row.schemaname}.${row.tablename} (owner: ${row.tableowner})`);
    });
    
    // Check foreign key constraints
    const fkResult = await pool.query(`
      SELECT 
        tc.table_schema,
        tc.table_name,
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_schema = 'context' AND tc.constraint_type = 'FOREIGN KEY'
    `);
    
    console.log('\\nForeign key constraints:');
    fkResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}.${row.column_name} → ${row.foreign_table_name}.${row.foreign_column_name}`);
    });
    
    // Check if pgvector extension exists (for embedding support)
    const vectorCheck = await pool.query(`
      SELECT EXISTS(
        SELECT 1 FROM pg_extension WHERE extname = 'vector'
      ) as vector_installed
    `);
    
    if (vectorCheck.rows[0].vector_installed) {
      console.log('✅ pgvector extension is installed - embedding support ready');
    } else {
      console.log('⚠️  pgvector extension not found - embeddings will need extension installation');
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
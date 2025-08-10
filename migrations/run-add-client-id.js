import 'dotenv/config';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'add_client_id_to_files_and_chunks.sql');
    const migration = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Running migration to add client_id columns...');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Split migration into individual statements and run them
    const statements = migration
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      await client.query(statement);
    }
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('✅ Migration completed successfully');
    
    // Verify the columns were added
    const filesCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'context' 
      AND table_name = 'files' 
      AND column_name = 'client_id'
    `);
    
    const chunksCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'context' 
      AND table_name = 'chunks' 
      AND column_name = 'client_id'
    `);
    
    if (filesCheck.rows.length > 0) {
      console.log('✅ client_id column added to context.files');
    }
    
    if (chunksCheck.rows.length > 0) {
      console.log('✅ client_id column added to context.chunks');
    }
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(console.error);
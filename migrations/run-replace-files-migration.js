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
    console.log('🔄 Starting files → context schema replacement...');
    
    // Read the migration SQL
    const migrationPath = path.join(__dirname, '012_replace_files_with_context.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Executing migration SQL...');
    
    // Execute the migration
    const result = await pool.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('📊 Final verification:');
    
    // Verify the migration results
    const contextFilesResult = await pool.query(`
      SELECT 
        source_type,
        COUNT(*) as count,
        SUM(file_size) as total_size
      FROM context.files 
      GROUP BY source_type
      ORDER BY source_type
    `);
    
    console.log('Context files by source:');
    contextFilesResult.rows.forEach(row => {
      const sizeInMB = (row.total_size / (1024 * 1024)).toFixed(2);
      console.log(`  - ${row.source_type}: ${row.count} files (${sizeInMB} MB)`);
    });
    
    // Check meeting file relationships
    const meetingFilesResult = await pool.query(`
      SELECT 
        relationship_type,
        COUNT(*) as count,
        COUNT(DISTINCT meeting_id) as unique_meetings
      FROM meetings.meeting_files 
      GROUP BY relationship_type
      ORDER BY relationship_type
    `);
    
    console.log('\\nMeeting file relationships:');
    meetingFilesResult.rows.forEach(row => {
      console.log(`  - ${row.relationship_type}: ${row.count} relationships across ${row.unique_meetings} meetings`);
    });
    
    // Verify schemas
    const schemaResult = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name IN ('files', 'context')
      ORDER BY schema_name
    `);
    
    console.log('\\nRemaining schemas:');
    schemaResult.rows.forEach(row => {
      console.log(`  - ${row.schema_name}`);
    });
    
    if (schemaResult.rows.some(row => row.schema_name === 'files')) {
      console.log('⚠️  Files schema still exists - migration may have failed');
    } else {
      console.log('✅ Files schema successfully removed');
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
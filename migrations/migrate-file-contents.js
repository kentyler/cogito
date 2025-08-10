import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrateFileContents() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('🔄 Starting file content migration from disk...');
    
    // Get all context files that need content migration
    const filesResult = await pool.query(`
      SELECT id, filename, metadata->>'original_file_path' as file_path
      FROM context.files 
      WHERE metadata->>'needs_content_migration' = 'true'
      ORDER BY id
    `);
    
    if (filesResult.rows.length === 0) {
      console.log('✅ No files need content migration');
      return;
    }
    
    console.log(`📁 Found ${filesResult.rows.length} files to migrate:`);
    
    for (const file of filesResult.rows) {
      console.log(`\\n🔄 Processing: ${file.filename}`);
      console.log(`   File path: ${file.file_path}`);
      
      try {
        // Check if file exists on disk
        const fullPath = path.resolve(file.file_path);
        if (!fs.existsSync(fullPath)) {
          console.log(`   ⚠️  File not found at: ${fullPath}`);
          console.log(`   🔍 Checking current directory...`);
          
          // Try to find the file in current directory
          const filename = path.basename(file.file_path);
          const currentDirPath = path.resolve(filename);
          
          if (fs.existsSync(currentDirPath)) {
            console.log(`   ✅ Found file in current directory: ${currentDirPath}`);
            await migrateFileContent(pool, file.id, file.filename, currentDirPath);
          } else {
            console.log(`   ❌ File not found anywhere, skipping`);
          }
        } else {
          console.log(`   ✅ File found, migrating content...`);
          await migrateFileContent(pool, file.id, file.filename, fullPath);
        }
        
      } catch (error) {
        console.error(`   ❌ Error processing ${file.filename}:`, error.message);
      }
    }
    
    console.log('\\n📊 Migration summary:');
    const summaryResult = await pool.query(`
      SELECT 
        COUNT(*) as total_files,
        COUNT(CASE WHEN metadata->>'needs_content_migration' = 'true' THEN 1 END) as still_need_migration,
        COUNT(CASE WHEN length(content_data) > 50 THEN 1 END) as files_with_content
      FROM context.files 
      WHERE source_type = 'upload'
    `);
    
    const summary = summaryResult.rows[0];
    console.log(`   Total files: ${summary.total_files}`);
    console.log(`   Files with content: ${summary.files_with_content}`);
    console.log(`   Still need migration: ${summary.still_need_migration}`);
    
  } catch (error) {
    console.error('❌ File content migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function migrateFileContent(pool, fileId, filename, filePath) {
  try {
    // Read file content
    const content = fs.readFileSync(filePath);
    const actualSize = content.length;
    
    console.log(`   📏 File size: ${actualSize} bytes`);
    
    // Update the database record
    await pool.query(`
      UPDATE context.files 
      SET 
        content_data = $1,
        file_size = $2,
        metadata = metadata - 'needs_content_migration'
      WHERE id = $3
    `, [content, actualSize, fileId]);
    
    console.log(`   ✅ Content migrated successfully`);
    
  } catch (error) {
    console.error(`   ❌ Failed to migrate content for ${filename}:`, error.message);
    throw error;
  }
}

migrateFileContents();
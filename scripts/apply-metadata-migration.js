#!/usr/bin/env node

/**
 * Apply metadata migration to locations table
 */

import { DatabaseManager } from '../lib/database.js';
import fs from 'fs';
import path from 'path';

const config = {
  host: 'localhost',
  port: 5432,
  database: 'cogito_multi',
  user: 'ken',
  password: '7297'
};

async function applyMigration() {
  const db = new DatabaseManager(config);
  
  try {
    // Read migration file
    const migrationPath = path.join(process.cwd(), 'migrations', '004_locations_metadata.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('🚀 Applying metadata migration...');
    
    // Execute migration
    await db.pool.query(migrationSQL);
    
    console.log('✅ Migration applied successfully');
    
    // Verify the update
    const result = await db.pool.query(`
      SELECT file_path, metadata 
      FROM locations 
      WHERE file_path = '/home/ken/claude-projects/cogito/daily_embeddings.py'
    `);
    
    if (result.rows.length > 0) {
      console.log('\n📊 Updated entry:');
      console.log(`Path: ${result.rows[0].file_path}`);
      console.log(`Metadata:`, JSON.stringify(result.rows[0].metadata, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

applyMigration();
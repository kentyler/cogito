#!/usr/bin/env node

import 'dotenv/config';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('render.com') ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  try {
    console.log('🚀 Running migration: Update files source_type constraint...');
    
    // Read the migration SQL
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '022_update_files_source_type_constraint.sql'), 
      'utf8'
    );
    
    // Execute the migration
    await pool.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the constraint was updated
    const verifyResult = await pool.query(`
      SELECT 
        conname as constraint_name,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint
      WHERE conrelid = 'context.files'::regclass
        AND contype = 'c'
        AND conname = 'files_source_type_check'
    `);
    
    console.log('\n📊 Updated constraint:');
    console.table(verifyResult.rows);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Details:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
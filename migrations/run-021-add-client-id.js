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
    console.log('🚀 Running migration: Add client_id to context tables...');
    
    // Read the migration SQL
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '021_add_client_id_to_context_tables.sql'), 
      'utf8'
    );
    
    // Execute the migration
    await pool.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the columns were added
    const verifyResult = await pool.query(`
      SELECT 
        t.table_name,
        c.column_name,
        c.data_type
      FROM information_schema.columns c
      JOIN information_schema.tables t ON c.table_schema = t.table_schema AND c.table_name = t.table_name
      WHERE t.table_schema = 'context' 
        AND t.table_name IN ('files', 'chunks')
        AND c.column_name = 'client_id'
      ORDER BY t.table_name;
    `);
    
    console.log('\n📊 Verification - client_id columns added:');
    console.table(verifyResult.rows);
    
    // Check indexes
    const indexResult = await pool.query(`
      SELECT 
        tablename,
        indexname
      FROM pg_indexes 
      WHERE schemaname = 'context' 
        AND indexname LIKE '%client%'
      ORDER BY tablename, indexname;
    `);
    
    console.log('\n📊 Indexes created:');
    console.table(indexResult.rows);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Details:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
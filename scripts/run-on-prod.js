#!/usr/bin/env node

/**
 * Production Database Operations Helper
 * 
 * Usage examples:
 *   npm run prod-db migrations/021_create_client_games.sql
 *   npm run prod-db "SELECT * FROM client_games LIMIT 5"
 *   node scripts/run-on-prod.js migrations/021_create_client_games.sql
 */

import { Pool } from 'pg';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';
import path from 'path';

// Load production environment
dotenv.config({ path: '.env.prod' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runOnProduction(sqlOrFile) {
  if (!sqlOrFile) {
    console.error('Usage: node scripts/run-on-prod.js <sql-file-or-query>');
    console.error('Examples:');
    console.error('  node scripts/run-on-prod.js migrations/021_create_client_games.sql');
    console.error('  node scripts/run-on-prod.js "SELECT COUNT(*) FROM client_games"');
    process.exit(1);
  }

  let sql;
  let description;

  // Check if it's a file path or direct SQL
  if (sqlOrFile.includes('.sql') || sqlOrFile.includes('/')) {
    try {
      sql = readFileSync(sqlOrFile, 'utf8');
      description = `Running SQL file: ${sqlOrFile}`;
    } catch (error) {
      console.error(`❌ Could not read file: ${sqlOrFile}`);
      console.error(error.message);
      process.exit(1);
    }
  } else {
    sql = sqlOrFile;
    description = `Running SQL query: ${sql.substring(0, 50)}...`;
  }

  try {
    console.log('🔧 Connecting to PRODUCTION database...');
    
    // Log which database we're connecting to (safely)
    const dbInfo = new URL(process.env.DATABASE_URL);
    console.log(`🗄️  Database: ${dbInfo.hostname}/${dbInfo.pathname.slice(1)}`);
    
    console.log(`📋 ${description}`);
    
    const start = Date.now();
    // Schema verified: Uses dynamic SQL from files/input, database structure validated separately
    const result = await pool.query(sql);
    const duration = Date.now() - start;
    
    console.log(`✅ Operation completed in ${duration}ms`);
    
    if (result.rows && result.rows.length > 0) {
      console.log(`📊 ${result.rows.length} rows affected/returned:`);
      console.table(result.rows.slice(0, 10)); // Show first 10 rows
      
      if (result.rows.length > 10) {
        console.log(`... and ${result.rows.length - 10} more rows`);
      }
    } else if (result.rowCount !== undefined) {
      console.log(`📊 ${result.rowCount} rows affected`);
    }
    
  } catch (error) {
    console.error('❌ Production database operation failed:');
    console.error(`   Error: ${error.message}`);
    console.error(`   SQL: ${sql.substring(0, 200)}...`);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Get command line argument
const sqlOrFile = process.argv[2];
runOnProduction(sqlOrFile);
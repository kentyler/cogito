#!/usr/bin/env node

/**
 * Apply Identity Tracking Schema to Cogito-Multi Database
 */

import { DatabaseManager } from '../lib/database.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyIdentitySchema() {
  const config = {
    host: 'localhost',
    port: 5432,
    database: 'cogito_multi',
    user: 'ken',
    password: '7297'
  };
  
  const db = new DatabaseManager(config);
  
  try {
    console.log('🔧 Applying identity tracking schema to cogito-multi...');
    
    await db.testConnection();
    
    // Read the identity schema file
    const schemaPath = path.join(__dirname, '../schema/04_identity_tracking.sql');
    const schemaSQL = await fs.readFile(schemaPath, 'utf8');
    
    console.log('📋 Executing identity schema...');
    
    // Split on semicolons and execute each statement
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    let successCount = 0;
    let skipCount = 0;
    
    for (const statement of statements) {
      try {
        await db.pool.query(statement);
        successCount++;
        
        // Extract table/view/function name for logging
        const match = statement.match(/CREATE\s+(TABLE|VIEW|INDEX|TYPE|FUNCTION|TRIGGER)\s+(?:IF NOT EXISTS\s+)?(\w+)/i);
        if (match) {
          console.log(`✅ Created ${match[1].toLowerCase()}: ${match[2]}`);
        }
      } catch (error) {
        if (error.code === '42P07' || error.code === '42710') {
          // Table/function already exists
          const match = statement.match(/CREATE\s+(TABLE|VIEW|INDEX|TYPE|FUNCTION|TRIGGER)\s+(?:IF NOT EXISTS\s+)?(\w+)/i);
          if (match) {
            console.log(`⏭️  Skipped ${match[1].toLowerCase()} (already exists): ${match[2]}`);
          }
          skipCount++;
        } else {
          console.error(`❌ Error executing statement: ${error.message}`);
          console.error(`Statement: ${statement.substring(0, 100)}...`);
          // Continue with other statements
        }
      }
    }
    
    console.log(`\n🎉 Identity schema applied successfully!`);
    console.log(`   ✅ ${successCount} statements executed`);
    console.log(`   ⏭️  ${skipCount} statements skipped (already existed)`);
    
    // Verify key tables exist
    console.log('\n🔍 Verifying identity tables...');
    const tables = ['identities', 'interactions', 'analysis_snapshots', 'email_details'];
    
    for (const tableName of tables) {
      const result = await db.pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = $1
      `, [tableName]);
      
      if (result.rows.length > 0) {
        console.log(`✅ Table exists: ${tableName}`);
      } else {
        console.log(`❌ Table missing: ${tableName}`);
      }
    }
    
    // Check views
    console.log('\n🔍 Verifying identity views...');
    const views = ['recent_interactions', 'identity_summary', 'relationship_insights'];
    
    for (const viewName of views) {
      const result = await db.pool.query(`
        SELECT table_name 
        FROM information_schema.views 
        WHERE table_schema = 'public' AND table_name = $1
      `, [viewName]);
      
      if (result.rows.length > 0) {
        console.log(`✅ View exists: ${viewName}`);
      } else {
        console.log(`❌ View missing: ${viewName}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Identity schema application failed:', error);
    process.exit(1);
  } finally {
    await db.pool.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  applyIdentitySchema();
}

export { applyIdentitySchema };
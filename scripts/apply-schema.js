#!/usr/bin/env node

/**
 * Apply PostgreSQL Schema Script
 * Applies the schema to an existing PostgreSQL database
 */

import { DatabaseManager } from '../lib/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applySchema() {
  console.log('📋 Applying PostgreSQL schema to cogito_multi database...');
  
  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, '..', '..', 'cogito-multi-schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      console.error('❌ Schema file not found at:', schemaPath);
      process.exit(1);
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf8');
    console.log('📄 Schema file loaded');
    
    // Connect to database
    const db = new DatabaseManager();
    console.log('📡 Connected to PostgreSQL');
    
    // Split schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`🔧 Executing ${statements.length} schema statements...`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim()) {
        try {
          await db.pool.query(statement);
          
          // Log table creation specifically
          if (statement.toUpperCase().includes('CREATE TABLE')) {
            const tableName = statement.match(/CREATE TABLE (\w+)/i)?.[1];
            console.log(`  ✅ Created table: ${tableName}`);
          } else if (statement.toUpperCase().includes('CREATE INDEX')) {
            const indexName = statement.match(/CREATE INDEX (\w+)/i)?.[1];
            console.log(`  📊 Created index: ${indexName}`);
          } else if (statement.toUpperCase().includes('CREATE VIEW')) {
            const viewName = statement.match(/CREATE VIEW (\w+)/i)?.[1];
            console.log(`  👁️  Created view: ${viewName}`);
          } else {
            console.log(`  ✅ Executed statement ${i + 1}/${statements.length}`);
          }
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log(`  ⚠️  Skipped (already exists): ${error.message.split(' ')[1]}`);
          } else {
            console.error(`  ❌ Failed to execute statement ${i + 1}:`, error.message);
            console.error(`  Statement: ${statement.substring(0, 100)}...`);
          }
        }
      }
    }
    
    // Verify tables were created
    console.log('\n🔍 Verifying schema application...');
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    const result = await db.pool.query(tablesQuery);
    const tables = result.rows.map(row => row.table_name);
    
    console.log(`✅ Found ${tables.length} tables:`);
    tables.forEach(table => console.log(`  - ${table}`));
    
    // Verify views
    const viewsQuery = `
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    const viewResult = await db.pool.query(viewsQuery);
    const views = viewResult.rows.map(row => row.table_name);
    
    if (views.length > 0) {
      console.log(`👁️  Found ${views.length} views:`);
      views.forEach(view => console.log(`  - ${view}`));
    }
    
    await db.close();
    console.log('\n🎉 Schema applied successfully!');
    
  } catch (error) {
    console.error('❌ Schema application failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Connection refused. Make sure PostgreSQL is running:');
      console.log('   sudo service postgresql start');
    } else if (error.code === '3D000') {
      console.log('\n💡 Database does not exist. Create it first:');
      console.log('   sudo -u postgres createdb cogito_multi');
    }
    
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  applySchema();
}

export { applySchema };
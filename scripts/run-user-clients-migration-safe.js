#!/usr/bin/env node

import { dbAgent } from '../lib/database-agent.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    await dbAgent.connect();
    
    // Check current state
    console.log('Checking current state...');
    
    const users = await dbAgent.query(`
      SELECT 
        u.id,
        u.email,
        u.client_id,
        c.name as client_name,
        u.created_at
      FROM client_mgmt.users u
      LEFT JOIN client_mgmt.clients c ON u.client_id = c.id
      ORDER BY u.email, u.created_at
    `);
    
    console.log(`\nCurrent users (${users.rows.length} total):`);
    users.rows.forEach(u => {
      console.log(`  ID: ${u.id}, Email: ${u.email}, Client: ${u.client_name || 'NULL'}`);
    });
    
    // Run the migration
    const migrationPath = path.join(__dirname, '../migrations/030_create_user_clients_table_preserve_duplicates.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf-8');
    
    console.log('\nRunning migration...');
    await dbAgent.query(migrationSQL);
    
    console.log('✅ Migration completed successfully');
    
    // Show results
    const relationships = await dbAgent.query(`
      SELECT 
        u.id as user_id,
        u.email,
        c.name as client_name,
        uc.role,
        uc.joined_at
      FROM client_mgmt.user_clients uc
      JOIN client_mgmt.users u ON uc.user_id = u.id
      JOIN client_mgmt.clients c ON uc.client_id = c.id
      ORDER BY u.email, c.name
    `);
    
    console.log(`\nCreated user-client relationships (${relationships.rows.length} total):`);
    relationships.rows.forEach(r => {
      console.log(`  User ${r.user_id} (${r.email}) → ${r.client_name} [${r.role}]`);
    });
    
    // Summary
    const summary = await dbAgent.query(`
      SELECT 
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT client_id) as unique_clients,
        COUNT(*) as total_relationships
      FROM client_mgmt.user_clients
    `);
    
    console.log('\nSummary:');
    console.log(`  Unique users with clients: ${summary.rows[0].unique_users}`);
    console.log(`  Unique clients with users: ${summary.rows[0].unique_clients}`);
    console.log(`  Total relationships: ${summary.rows[0].total_relationships}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await dbAgent.close();
  }
}

runMigration();
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
    
    // First, let's check the current state
    console.log('Checking current users...');
    const users = await dbAgent.query(`
      SELECT id, email, client_id, created_at 
      FROM client_mgmt.users 
      ORDER BY email, created_at
    `);
    
    console.log(`Found ${users.rows.length} users`);
    
    // Check for duplicates
    const duplicates = await dbAgent.query(`
      SELECT email, COUNT(*) as count 
      FROM client_mgmt.users 
      WHERE email IS NOT NULL
      GROUP BY email 
      HAVING COUNT(*) > 1
    `);
    
    if (duplicates.rows.length > 0) {
      console.log('\nFound duplicate emails:');
      duplicates.rows.forEach(d => {
        console.log(`  ${d.email}: ${d.count} records`);
      });
    }
    
    // Read and run the migration
    const migrationPath = path.join(__dirname, '../migrations/030_create_user_clients_table.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf-8');
    
    console.log('\nRunning migration: Create user_clients table...');
    
    await dbAgent.query(migrationSQL);
    
    console.log('✅ Migration completed successfully');
    
    // Verify the results
    const userClients = await dbAgent.query(`
      SELECT COUNT(*) as count FROM client_mgmt.user_clients
    `);
    
    console.log(`\n✅ Created ${userClients.rows[0].count} user-client relationships`);
    
    // Check for users marked as duplicates
    const markedDuplicates = await dbAgent.query(`
      SELECT id, email, metadata->>'duplicate_of' as primary_user_id
      FROM client_mgmt.users
      WHERE metadata->>'duplicate_of' IS NOT NULL
    `);
    
    if (markedDuplicates.rows.length > 0) {
      console.log(`\n⚠️  Found ${markedDuplicates.rows.length} duplicate users marked for cleanup:`);
      markedDuplicates.rows.forEach(u => {
        console.log(`  User ${u.id} (${u.email}) is duplicate of user ${u.primary_user_id}`);
      });
    }
    
    // Show sample of user_clients data
    const sample = await dbAgent.query(`
      SELECT 
        u.email,
        c.name as client_name,
        uc.role,
        uc.joined_at
      FROM client_mgmt.user_clients uc
      JOIN client_mgmt.users u ON uc.user_id = u.id
      JOIN client_mgmt.clients c ON uc.client_id = c.id
      LIMIT 5
    `);
    
    console.log('\nSample user-client relationships:');
    sample.rows.forEach(r => {
      console.log(`  ${r.email} → ${r.client_name} (${r.role})`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await dbAgent.close();
  }
}

runMigration();
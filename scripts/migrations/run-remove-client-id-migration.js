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
    
    // Verify user_clients has all the data before removing client_id
    console.log('Verifying user_clients data before migration...');
    
    const orphanCheck = await dbAgent.query(`
      SELECT u.id, u.email, u.client_id
      FROM client_mgmt.users u
      WHERE u.client_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM client_mgmt.user_clients uc 
          WHERE uc.user_id = u.id AND uc.client_id = u.client_id
        )
    `);
    
    if (orphanCheck.rows.length > 0) {
      console.error('❌ Found users with client_id that are not in user_clients:');
      orphanCheck.rows.forEach(u => {
        console.error(`  User ${u.id} (${u.email}) has client_id ${u.client_id}`);
      });
      process.exit(1);
    }
    
    console.log('✅ All user-client relationships are preserved in user_clients table');
    
    // Run the migration
    const migrationPath = path.join(__dirname, '../migrations/031_remove_client_id_from_users.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf-8');
    
    console.log('\nRunning migration to remove client_id from users...');
    await dbAgent.query(migrationSQL);
    
    console.log('✅ Migration completed successfully');
    
    // Verify the column is gone
    const columnCheck = await dbAgent.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'client_mgmt' 
        AND table_name = 'users' 
        AND column_name = 'client_id'
    `);
    
    if (columnCheck.rows.length === 0) {
      console.log('✅ Verified: client_id column has been removed from users table');
    } else {
      console.log('⚠️  Warning: client_id column still exists');
    }
    
    // Show new table structure
    const structure = await dbAgent.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'client_mgmt' AND table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('\nNew users table structure:');
    structure.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await dbAgent.close();
  }
}

runMigration();
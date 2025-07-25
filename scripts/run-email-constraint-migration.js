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
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/029_remove_users_email_unique_constraint.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf-8');
    
    console.log('Running migration: Remove users email unique constraint...');
    
    // Run the migration
    await dbAgent.query(migrationSQL);
    
    console.log('✅ Migration completed successfully');
    
    // Verify the constraint is gone
    const constraints = await dbAgent.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_schema = 'client_mgmt' 
        AND table_name = 'users' 
        AND constraint_type = 'UNIQUE'
        AND constraint_name = 'users_email_key'
    `);
    
    if (constraints.rows.length === 0) {
      console.log('✅ Verified: users_email_key constraint has been removed');
    } else {
      console.log('⚠️  Warning: users_email_key constraint still exists');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await dbAgent.close();
  }
}

runMigration();
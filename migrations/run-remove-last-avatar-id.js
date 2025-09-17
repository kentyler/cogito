#!/usr/bin/env node

import { DatabaseAgent } from '../database/database-agent.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const db = new DatabaseAgent();
  
  try {
    console.log('🔧 Connecting to database...');
    await db.connect();
    
    console.log('📝 Reading migration file...');
    const sqlPath = path.join(__dirname, 'remove_last_avatar_id_column.sql');
    const sql = await fs.readFile(sqlPath, 'utf8');
    
    console.log('🚀 Running migration to remove last_avatar_id column...');
    await db.connector.query(sql);
    
    console.log('✅ Migration completed successfully!');
    console.log('   - Removed last_avatar_id column from client_mgmt.users');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await db.disconnect();
  }
}

// Run the migration
runMigration().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
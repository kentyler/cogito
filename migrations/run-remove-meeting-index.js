#!/usr/bin/env node

/**
 * Migration: Remove meeting_index field (replaced by turn_index)
 */

import { DatabaseAgent } from '../database/database-agent.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const dbAgent = new DatabaseAgent();
  
  try {
    console.log('🚀 Starting meeting_index removal migration...');
    
    // Connect to database
    await dbAgent.connect();
    console.log('✅ Connected to database');
    
    // Check if meeting_index exists before removing
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'meetings' 
      AND table_name = 'turns' 
      AND column_name = 'meeting_index'
    `;
    
    const checkResult = await dbAgent.connector.query(checkQuery);
    
    if (checkResult.rows.length === 0) {
      console.log('ℹ️ meeting_index column does not exist, skipping removal');
      return;
    }
    
    console.log('🔍 Found meeting_index column, proceeding with removal');
    
    // Read SQL migration file
    const sqlPath = path.join(__dirname, 'remove_meeting_index_field.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('📄 Loaded migration SQL');
    
    // Run migration
    await dbAgent.connector.query(sql);
    console.log('✅ Migration executed successfully');
    
    // Verify the field was removed
    const verifyResult = await dbAgent.connector.query(checkQuery);
    
    if (verifyResult.rows.length === 0) {
      console.log('✅ Verified: meeting_index field removed successfully');
    } else {
      console.error('❌ Warning: meeting_index field still exists after migration');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Use close instead of disconnect
    try {
      await dbAgent.close();
      console.log('🔌 Disconnected from database');
    } catch (e) {
      // Ignore disconnect errors
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration()
    .then(() => {
      console.log('✨ Migration completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}
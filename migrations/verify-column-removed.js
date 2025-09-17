#!/usr/bin/env node

import { DatabaseAgent } from '../database/database-agent.js';

async function verifyColumnRemoved() {
  const db = new DatabaseAgent();
  
  try {
    console.log('🔧 Connecting to database...');
    await db.connect();
    
    console.log('🔍 Checking table schema...');
    const result = await db.connector.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'client_mgmt' 
        AND table_name = 'users'
        AND column_name = 'last_avatar_id'
    `);
    
    if (result.rows.length === 0) {
      console.log('✅ Success! last_avatar_id column has been removed from client_mgmt.users');
    } else {
      console.log('❌ Column still exists:', result.rows[0]);
    }
    
    // Show current columns
    const allColumns = await db.connector.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_schema = 'client_mgmt' 
        AND table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Current columns in client_mgmt.users:');
    allColumns.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  }
}

// Run verification
verifyColumnRemoved().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
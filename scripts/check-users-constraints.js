#!/usr/bin/env node

import { dbAgent } from '../lib/database-agent.js';

async function checkUsersConstraints() {
  try {
    await dbAgent.connect();
    
    // Check all constraints and indexes on users table
    const constraints = await dbAgent.query(`
      SELECT 
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.table_schema = 'client_mgmt' 
        AND tc.table_name = 'users'
      ORDER BY tc.constraint_type, tc.constraint_name;
    `);
    
    console.log('Constraints on client_mgmt.users:');
    constraints.rows.forEach(c => {
      console.log(`  ${c.constraint_name}: ${c.constraint_type} on ${c.column_name}`);
    });
    
    // Check indexes
    const indexes = await dbAgent.query(`
      SELECT 
        i.relname as index_name,
        ix.indisunique as is_unique,
        a.attname as column_name
      FROM pg_index ix
      JOIN pg_class t ON t.oid = ix.indrelid
      JOIN pg_class i ON i.oid = ix.indexrelid
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
      JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE t.relname = 'users' 
        AND n.nspname = 'client_mgmt'
      ORDER BY i.relname;
    `);
    
    console.log('\nIndexes on client_mgmt.users:');
    indexes.rows.forEach(idx => {
      console.log(`  ${idx.index_name}: ${idx.is_unique ? 'UNIQUE' : 'NON-UNIQUE'} on ${idx.column_name}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await dbAgent.close();
  }
}

checkUsersConstraints();
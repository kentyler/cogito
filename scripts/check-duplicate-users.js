#!/usr/bin/env node

import { dbAgent } from '../lib/database-agent.js';

async function checkDuplicates() {
  try {
    await dbAgent.connect();
    
    // Check all users with duplicate emails
    const duplicates = await dbAgent.query(`
      SELECT 
        u1.id,
        u1.email,
        u1.client_id,
        u1.created_at,
        u1.metadata,
        c.name as client_name
      FROM client_mgmt.users u1
      LEFT JOIN client_mgmt.clients c ON u1.client_id = c.id
      WHERE u1.email IN (
        SELECT email 
        FROM client_mgmt.users 
        WHERE email IS NOT NULL
        GROUP BY email 
        HAVING COUNT(*) > 1
      )
      ORDER BY u1.email, u1.created_at
    `);
    
    console.log('Duplicate users:');
    duplicates.rows.forEach(u => {
      console.log(`  ID: ${u.id}, Email: ${u.email}, Client: ${u.client_name || 'NULL'}, Created: ${u.created_at}`);
    });
    
    // Check if user_clients table exists
    const tableExists = await dbAgent.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'client_mgmt' 
        AND table_name = 'user_clients'
      )
    `);
    
    console.log(`\nuser_clients table exists: ${tableExists.rows[0].exists}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await dbAgent.close();
  }
}

checkDuplicates();
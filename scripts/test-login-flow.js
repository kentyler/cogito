#!/usr/bin/env node

/**
 * Test the new login flow with user_clients
 */

import { dbAgent } from '../lib/database-agent.js';

async function testLoginFlow() {
  try {
    await dbAgent.connect();
    
    console.log('🧪 Testing Login Flow with user_clients\n');
    
    // 1. Show current state
    console.log('1️⃣ Current users and their client associations:\n');
    
    const users = await dbAgent.query(`
      SELECT 
        u.id,
        u.email,
        COUNT(uc.client_id) as client_count,
        STRING_AGG(c.name, ', ' ORDER BY c.name) as clients
      FROM client_mgmt.users u
      LEFT JOIN client_mgmt.user_clients uc ON u.id = uc.user_id AND uc.is_active = true
      LEFT JOIN client_mgmt.clients c ON uc.client_id = c.id
      GROUP BY u.id, u.email
      ORDER BY u.email
    `);
    
    users.rows.forEach(user => {
      console.log(`  ${user.email}: ${user.client_count} client(s) - ${user.clients || 'None'}`);
    });
    
    // 2. Show specific case for duplicate emails
    console.log('\n2️⃣ Duplicate email cases:\n');
    
    const duplicates = await dbAgent.query(`
      SELECT 
        u.id,
        u.email,
        u.password_hash IS NOT NULL as has_password,
        c.name as client_name
      FROM client_mgmt.users u
      LEFT JOIN client_mgmt.user_clients uc ON u.id = uc.user_id
      LEFT JOIN client_mgmt.clients c ON uc.client_id = c.id
      WHERE u.email IN (
        SELECT email FROM client_mgmt.users 
        WHERE email IS NOT NULL
        GROUP BY email HAVING COUNT(*) > 1
      )
      ORDER BY u.email, u.id
    `);
    
    let currentEmail = '';
    duplicates.rows.forEach(dup => {
      if (dup.email !== currentEmail) {
        currentEmail = dup.email;
        console.log(`  Email: ${dup.email}`);
      }
      console.log(`    - User ID ${dup.id}: ${dup.has_password ? 'Has password' : 'No password'}, Client: ${dup.client_name || 'None'}`);
    });
    
    // 3. Simulate login scenarios
    console.log('\n3️⃣ Login scenarios:\n');
    
    // Scenario A: User with single client
    const singleClient = await dbAgent.query(`
      SELECT u.email, COUNT(uc.client_id) as client_count
      FROM client_mgmt.users u
      JOIN client_mgmt.user_clients uc ON u.id = uc.user_id
      WHERE u.password_hash IS NOT NULL
      GROUP BY u.id, u.email
      HAVING COUNT(uc.client_id) = 1
      LIMIT 1
    `);
    
    if (singleClient.rows.length > 0) {
      console.log(`  ✅ Single client user: ${singleClient.rows[0].email} → Auto-select client`);
    }
    
    // Scenario B: User with multiple clients (if any)
    const multiClient = await dbAgent.query(`
      SELECT u.email, COUNT(uc.client_id) as client_count
      FROM client_mgmt.users u
      JOIN client_mgmt.user_clients uc ON u.id = uc.user_id
      WHERE u.password_hash IS NOT NULL
      GROUP BY u.id, u.email
      HAVING COUNT(uc.client_id) > 1
      LIMIT 1
    `);
    
    if (multiClient.rows.length > 0) {
      console.log(`  🔄 Multi-client user: ${multiClient.rows[0].email} → Requires client selection`);
    }
    
    // 4. Check for potential issues
    console.log('\n4️⃣ Potential issues:\n');
    
    // Users with no client access
    const noClients = await dbAgent.query(`
      SELECT u.email
      FROM client_mgmt.users u
      LEFT JOIN client_mgmt.user_clients uc ON u.id = uc.user_id AND uc.is_active = true
      WHERE uc.user_id IS NULL AND u.password_hash IS NOT NULL
    `);
    
    if (noClients.rows.length > 0) {
      console.log(`  ⚠️  Users with no client access:`);
      noClients.rows.forEach(u => console.log(`    - ${u.email}`));
    } else {
      console.log(`  ✅ All users with passwords have client access`);
    }
    
    console.log('\n✅ Login flow test complete!');
    console.log('\nFlow summary:');
    console.log('1. User enters email/password');
    console.log('2. System finds all users with that email');
    console.log('3. Validates password against each until match found');
    console.log('4. Checks user_clients for client associations');
    console.log('5. If 1 client → auto-login');
    console.log('6. If multiple clients → show selection form');
    console.log('7. If no clients → deny access');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await dbAgent.close();
  }
}

testLoginFlow();
#!/usr/bin/env node

/**
 * Test database connection and run invitations table migration
 */

import 'dotenv/config';
import { DatabaseAgent } from '../database/database-agent.js';
import fs from 'fs';

async function testDatabaseAndMigrate() {
  console.log('🔌 Testing database connection...\n');

  const dbAgent = new DatabaseAgent();

  try {
    await dbAgent.connect();
    console.log('✅ Database connection successful!\n');

    // Check if invitations table exists
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'client_mgmt'
        AND table_name = 'invitations'
      );
    `;

    const tableExists = await dbAgent.query(checkTableQuery);

    if (tableExists.rows[0].exists) {
      console.log('✅ Invitations table already exists');
    } else {
      console.log('📋 Creating invitations table...');

      // Read and execute migration
      const migrationSQL = fs.readFileSync('migrations/create_invitations_table.sql', 'utf8');
      await dbAgent.query(migrationSQL);

      console.log('✅ Invitations table created successfully!');
    }

    // Test the invitations operations
    console.log('\n🧪 Testing invitation operations...');

    const testUserId = 1; // Assuming there's a user with ID 1
    const testClientId = 1; // Assuming there's a client with ID 1

    // Test creating an invitation
    console.log('   Creating test invitation...');
    const invitation = await dbAgent.invitations.createInvitation({
      email: 'ken@8thfold.com',
      clientId: testClientId,
      invitedBy: testUserId,
      role: 'member',
      recipientName: 'Ken Test',
      personalMessage: 'Welcome to our test client!'
    });

    console.log('   ✅ Invitation created:', invitation.id);
    console.log('   📧 Token:', invitation.token);

    // Test retrieving invitation by token
    console.log('   Retrieving invitation by token...');
    const retrieved = await dbAgent.invitations.getInvitationByToken(invitation.token);
    console.log('   ✅ Retrieved invitation for:', retrieved.email);

    console.log('\n🎉 All tests passed! Invitation system is ready.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await dbAgent.close();
  }
}

testDatabaseAndMigrate().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
/**
 * Test helpers for database operations
 * Uses dev database for testing
 */

import 'dotenv/config';
import { DatabaseAgent } from '../../../database/database-agent.js';
import { TestFixtures } from './fixtures.js';

/**
 * Get a DatabaseAgent instance configured for testing
 * Uses the dev database from environment
 */
export async function getTestDbAgent() {
  const dbAgent = new DatabaseAgent();
  await dbAgent.connect();
  return dbAgent;
}

export { TestFixtures };

/**
 * Clean up test data (only data marked with test patterns)
 */
export async function cleanupTestData(dbAgent) {
  try {
    // Clean up in reverse dependency order
    
    // 1. Remove test chunks (depend on files) - if context schema exists
    try {
      await dbAgent.connector.query(`
        DELETE FROM context.chunks 
        WHERE metadata->>'test' = 'true'
        OR file_id IN (
          SELECT id FROM context.files WHERE metadata->>'test' = 'true'
        )
      `);
    } catch (error) {
      // Context schema might not exist in this environment
      console.log('ℹ️  Context schema not available for cleanup');
    }
    
    // 2. Remove test files - if context schema exists
    try {
      await dbAgent.connector.query(`
        DELETE FROM context.files 
        WHERE metadata->>'test' = 'true'
        OR filename LIKE 'test_file_%'
      `);
    } catch (error) {
      // Context schema might not exist in this environment
      console.log('ℹ️  Context files not available for cleanup');
    }
    
    // 3. Remove test turns (depend on meetings)
    await dbAgent.connector.query(`
      DELETE FROM meetings.turns 
      WHERE metadata->>'test' = 'true'
    `);
    
    // 4. Remove test meetings (depend on users and clients)
    await dbAgent.connector.query(`
      DELETE FROM meetings.meetings 
      WHERE metadata->>'test' = 'true'
    `);
    
    // 5. Remove test user-client associations
    await dbAgent.connector.query(`
      DELETE FROM client_mgmt.user_clients 
      WHERE user_id IN (
        SELECT id FROM client_mgmt.users WHERE email LIKE 'test_%@example.com'
      )
    `);
    
    // 6. Remove test users
    await dbAgent.connector.query(`
      DELETE FROM client_mgmt.users 
      WHERE email LIKE 'test_%@example.com'
    `);
    
    // 7. Remove test clients
    await dbAgent.connector.query(`
      DELETE FROM client_mgmt.clients 
      WHERE metadata->>'test' = 'true'
    `);
    
    console.log('✅ Test data cleaned up');
  } catch (error) {
    console.error('❌ Error cleaning up test data:', error);
    // Ignore error for test
  }
}

/**
 * Utility to run a test with automatic cleanup
 */
export async function withTestData(testFn) {
  const dbAgent = await getTestDbAgent();
  
  try {
    await testFn(dbAgent);
  } finally {
    await cleanupTestData(dbAgent);
    await dbAgent.close();
  }
}
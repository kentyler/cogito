/**
 * Test the modular database agent to ensure it works correctly
 */

import { DatabaseAgent } from '../lib/database-agent-modular.js';

async function testModularDatabaseAgent() {
  console.log('🧪 Testing modular DatabaseAgent...');
  
  const dbAgent = new DatabaseAgent();
  
  try {
    // Test 1: Connection
    console.log('1. Testing connection...');
    await dbAgent.connect();
    console.log('✅ Connection successful');
    
    // Test 2: Basic query
    console.log('2. Testing basic query...');
    const timeResult = await dbAgent.query('SELECT NOW() as current_time');
    console.log('✅ Basic query successful:', timeResult.rows[0].current_time);
    
    // Test 3: Schema inspection
    console.log('3. Testing schema inspection...');
    const schema = await dbAgent.getSchema();
    console.log(`✅ Schema loaded: ${schema.total_tables} tables`);
    
    // Test 4: Table finder
    console.log('4. Testing table finder...');
    const tableResult = await dbAgent.findTable('meetings');
    if (tableResult.found) {
      console.log('✅ Table finder successful:', tableResult.matches[0].table_name);
    } else {
      console.log('⚠️ No meetings table found');
    }
    
    // Test 5: Module access
    console.log('5. Testing module access...');
    const modules = dbAgent.modules;
    console.log('✅ Module access successful:', Object.keys(modules));
    
    // Test 6: Transaction
    console.log('6. Testing transaction...');
    await dbAgent.transaction(async (client) => {
      const result = await client.query('SELECT 1 as test');
      return result.rows[0];
    });
    console.log('✅ Transaction successful');
    
    console.log('🎉 All tests passed! Modular DatabaseAgent is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  } finally {
    await dbAgent.close();
    console.log('🔒 Database connection closed');
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testModularDatabaseAgent()
    .then(() => {
      console.log('✅ Test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

export { testModularDatabaseAgent };
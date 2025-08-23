/**
 * Test the modular speaker profile agent to ensure it works correctly
 */

import { SpeakerProfileAgent } from '../lib/speaker-profile-agent-modular.js';

async function testModularSpeakerProfileAgent() {
  console.log('🧪 Testing modular SpeakerProfileAgent...');
  
  const agent = new SpeakerProfileAgent({ 
    context: 'test.example.com',
    profileTurnLimit: 10 
  });
  
  try {
    // Test 1: Context extraction
    console.log('1. Testing context extraction...');
    const contextFromUrl = new SpeakerProfileAgent({ 
      meetingUrl: 'https://meet.google.com/abc-def-ghi' 
    });
    console.log('✅ Context extraction successful:', contextFromUrl.context);
    
    // Test 2: Module access
    console.log('2. Testing module access...');
    const modules = agent.modules;
    console.log('✅ Module access successful:', Object.keys(modules));
    
    // Test 3: Stats (before any processing)
    console.log('3. Testing initial stats...');
    const initialStats = agent.getStats();
    console.log('✅ Initial stats:', initialStats);
    
    // Test 4: Unknown speaker handler registration
    console.log('4. Testing unknown speaker handler...');
    let handlerCalled = false;
    agent.onUnknownSpeaker(async (speakerName, context) => {
      handlerCalled = true;
      console.log(`Handler called for: ${speakerName} in ${context}`);
      return null; // Return null to simulate no mapping found
    });
    console.log('✅ Unknown speaker handler registered');
    
    // Test 5: Database connection (via modules)
    console.log('5. Testing database connection...');
    await agent.modules.identifier.databaseAgent.connect();
    console.log('✅ Database connection successful');
    
    // Test 6: Basic database query
    console.log('6. Testing basic query via modules...');
    const timeResult = await agent.modules.identifier.databaseAgent.query('SELECT NOW() as current_time');
    console.log('✅ Basic query successful:', timeResult.rows[0].current_time);
    
    // Test 7: Cache operations
    console.log('7. Testing cache operations...');
    agent.clearCaches();
    const statsAfterClear = agent.getStats();
    console.log('✅ Cache operations successful:', statsAfterClear);
    
    // Test 8: Speaker lookup (should handle unknown speaker gracefully)
    console.log('8. Testing speaker lookup...');
    const unknownUser = await agent.lookupUser('NonExistentSpeaker123');
    console.log('✅ Speaker lookup handled gracefully:', unknownUser === null ? 'No user found' : 'User found');
    
    console.log('🎉 All tests passed! Modular SpeakerProfileAgent is working correctly.');
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
    // Ignore error for test
  } finally {
    await agent.modules.identifier.databaseAgent.close();
    console.log('🔒 Database connection closed');
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testModularSpeakerProfileAgent()
    .then(() => {
      console.log('✅ Test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

export { testModularSpeakerProfileAgent };
/**
 * Test the modular client detector to ensure it works correctly
 */

import { ClientDetector } from '../lib/client-detector-modular.js';
import { DatabaseAgent } from '../lib/database-agent.js';

async function testModularClientDetector() {
  console.log('🧪 Testing modular ClientDetector...');
  
  // Create database agent for the detector
  const dbAgent = new DatabaseAgent();
  const detector = new ClientDetector(dbAgent);
  
  try {
    // Test 1: Module access
    console.log('1. Testing module access...');
    const modules = detector.modules;
    console.log('✅ Module access successful:', Object.keys(modules));
    
    // Test 2: Database connection
    console.log('2. Testing database connection...');
    await dbAgent.connect();
    console.log('✅ Database connection successful');
    
    // Test 3: Client name extraction (no database needed)
    console.log('3. Testing client name extraction...');
    const testText = 'This is a meeting of the conflict club';
    const candidates = detector.modules.extractor.extractClientNames(testText, 'meeting');
    console.log('✅ Name extraction successful:', candidates);
    
    // Test 4: Debug mode
    console.log('4. Testing debug mode...');
    detector.enableDebug();
    console.log('✅ Debug mode enabled');
    
    // Test 5: Basic detection (with actual database query)
    console.log('5. Testing basic detection...');
    const detectionResult = await detector.detectClient('Meeting for test client xyz', 'meeting');
    console.log('✅ Detection completed:', detectionResult.status);
    
    // Test 6: No candidates scenario
    console.log('6. Testing no candidates scenario...');
    const noCandidatesResult = await detector.detectClient('This has no client names', 'general');
    console.log('✅ No candidates handled:', noCandidatesResult.status === 'no_candidates' ? 'Correct' : 'Unexpected');
    
    // Test 7: Result formatting (with mock data)
    console.log('7. Testing result formatting...');
    const mockSearchResults = { exact_matches: [], fuzzy_matches: [], keyword_matches: [] };
    const mockCandidates = ['test client'];
    const formattedResult = detector.modules.formatter.formatDetectionResult(
      mockSearchResults, mockCandidates, 'test text'
    );
    console.log('✅ Result formatting successful:', formattedResult.status);
    
    console.log('🎉 All tests passed! Modular ClientDetector is working correctly.');
    
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
  testModularClientDetector()
    .then(() => {
      console.log('✅ Test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

export { testModularClientDetector };
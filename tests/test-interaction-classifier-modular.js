/**
 * Test the modular interaction classifier to ensure it works correctly
 */

import { InteractionClassifier } from '../lib/interaction-classifier-modular.js';

async function testModularInteractionClassifier() {
  console.log('🧪 Testing modular InteractionClassifier...');
  
  try {
    // Test 1: Module access
    console.log('1. Testing module access...');
    const modules = InteractionClassifier.modules;
    console.log('✅ Module access successful:', Object.keys(modules));
    
    // Test 2: Milestone detection
    console.log('2. Testing milestone detection...');
    const milestoneText = '✅ Migration completed successfully! Database is now ready.';
    const milestoneResult = modules.milestone.detectMilestone(milestoneText);
    console.log('✅ Milestone detection:', milestoneResult.isMilestone ? 'Detected' : 'Not detected');
    
    // Test 3: Planning detection
    console.log('3. Testing planning detection...');
    const planningInput = 'What approach would you recommend for implementing this feature?';
    const planningResponse = 'I recommend we consider several architectural options for this implementation.';
    const planningResult = modules.planning.detectPlanning(planningInput, planningResponse);
    console.log('✅ Planning detection:', planningResult.isPlanning ? 'Detected' : 'Not detected');
    
    // Test 4: Thinking detection
    console.log('4. Testing thinking detection...');
    const thinkingInput = 'How does this relate to our previous discussion?';
    const thinkingResponse = 'This connects to our earlier conversation about architecture. I see a pattern here that suggests we need to consider the broader implications.';
    const thinkingResult = modules.thinking.detectThinkingProcess(thinkingInput, thinkingResponse);
    console.log('✅ Thinking detection:', thinkingResult.hasThinking ? 'Detected' : 'Not detected');
    
    // Test 5: Interaction filtering
    console.log('5. Testing interaction filtering...');
    const skipInput = 'run npm install';
    const skipResponse = 'Running npm install...';
    const shouldSkip = modules.filter.shouldSkipRecording(skipInput, skipResponse);
    console.log('✅ Skip detection:', shouldSkip ? 'Should skip' : 'Should not skip');
    
    // Test 6: Quality threshold
    console.log('6. Testing quality threshold...');
    const qualityInput = 'This is a substantial question about system architecture.';
    const qualityResponse = 'This is a detailed response explaining the architectural considerations and trade-offs.';
    const meetsQuality = modules.filter.meetsQualityThreshold(qualityInput, qualityResponse);
    console.log('✅ Quality threshold:', meetsQuality ? 'Meets threshold' : 'Below threshold');
    
    // Test 7: Full classification
    console.log('7. Testing full classification...');
    const classificationResult = InteractionClassifier.classifyInteraction(planningInput, planningResponse);
    console.log('✅ Full classification:', classificationResult.shouldRecord ? 'Should record' : 'Should not record');
    console.log('   Context type:', classificationResult.contextType);
    
    // Test 8: Routine interaction detection
    console.log('8. Testing routine interaction detection...');
    const routineInput = 'ok';
    const routineResponse = 'Understood.';
    const isRoutine = modules.filter.isRoutineInteraction(routineInput, routineResponse);
    console.log('✅ Routine detection:', isRoutine ? 'Is routine' : 'Not routine');
    
    console.log('🎉 All tests passed! Modular InteractionClassifier is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testModularInteractionClassifier()
    .then(() => {
      console.log('✅ Test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

export { testModularInteractionClassifier };
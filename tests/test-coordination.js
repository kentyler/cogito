#!/usr/bin/env node

/**
 * Test the unified evaporating cloud coordination system
 */

import { SpokespersonPersonality } from './lib/spokesperson.js';
import { DatabaseManager } from './lib/database.js';

async function testCoordination() {
  console.log('🧠 Testing Cogito Multi-Personality Coordination...\n');

  // Initialize system
  const config = {
    collaborator: 'test_user',
    database: { path: './cogito.db' }
  };

  const spokesperson = new SpokespersonPersonality(config);
  
  // Test scenarios that should trigger different coordination patterns
  const testInputs = [
    {
      input: "Help me write a technical blog post about recursion that's also engaging",
      expected: "Should trigger Writer + Coder coordination with precision vs engagement tension"
    },
    {
      input: "Debug this function but explain it in a way that makes sense philosophically",
      expected: "Should trigger Coder + Liminal coordination with technical vs philosophical tension"
    },
    {
      input: "Research the history of AI consciousness and create a narrative about it",
      expected: "Should trigger Researcher + Writer coordination with accuracy vs narrative tension"
    }
  ];

  for (const test of testInputs) {
    console.log(`\n📝 Test Input: "${test.input}"`);
    console.log(`   Expected: ${test.expected}`);
    
    try {
      // Get response through spokesperson
      const response = await spokesperson.respondToHuman(test.input, {
        sessionId: 'test_session_' + Date.now()
      });
      
      console.log(`\n✅ Response synthesized successfully`);
      console.log(`   Response preview: ${response.substring(0, 100)}...`);
      
      // Check database for deliberation details
      const db = new DatabaseManager(config.database);
      const complexity = await db.getComplexityIndicators(config.collaborator);
      
      console.log(`\n📊 Complexity Indicators:`);
      console.log(`   Evaporation opportunities: ${complexity.evaporation_opportunities}`);
      console.log(`   Conflicting requests: ${complexity.conflicting_requests}`);
      
      db.close();
      
    } catch (error) {
      console.error(`\n❌ Error:`, error.message);
    }
  }
  
  // Clean up
  spokesperson.db.close();
  
  console.log('\n\n🎉 Test complete!');
}

// Run test
testCoordination().catch(console.error);
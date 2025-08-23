#!/usr/bin/env node

/**
 * Detailed test of cogito-multi coordination with full output
 */

import { SpokespersonPersonality } from './lib/spokesperson.js';

async function testDetailed() {
  console.log('🧠 Detailed Cogito Multi-Personality Test\n');

  const config = {
    collaborator: 'test_user',
    database: { path: './cogito.db' }
  };

  const spokesperson = new SpokespersonPersonality(config);
  
  const testInput = 'Help me write a technical blog post about recursion that\'s also engaging';
  
  console.log(`📝 Input: "${testInput}"`);
  console.log('\n🔍 Processing...\n');
  
  try {
    const response = await spokesperson.respondToHuman(testInput, {
      sessionId: 'detailed_test_' + Date.now()
    });
    
    console.log('✅ Full Response:');
    console.log('─'.repeat(60));
    console.log(response);
    console.log('─'.repeat(60));
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.error(`Error: ${error.message}`);stack);
  }
  
  spokesperson.db.close();
  console.log('\n🎉 Detailed test complete!');
}

testDetailed().catch(console.error);
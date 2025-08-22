/**
 * Test Fragment Extraction Agent
 * 
 * Tests the fragment extraction agent on sample conversation turns
 * to verify TOC pattern recognition and database storage.
 */

const { FragmentExtractionAgent } = require('../lib/fragment-extraction-agent.cjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

async function testFragmentExtraction() {
  console.log('🧪 Testing Fragment Extraction Agent...\n');
  
  const agent = new FragmentExtractionAgent(process.env.DATABASE_URL);
  const clientId = 6; // Claude Code client
  const testSessionId = `test-session-${Date.now()}`;

  // Sample conversation turns representing different TOC elements
  const sampleTurns = [
    {
      turnId: uuidv4(),
      content: 'I\'m frustrated with the authentication setup process. It keeps failing when I try to integrate with OAuth providers.',
      expectedElements: ['undesirable_effect']
    },
    {
      turnId: uuidv4(), 
      content: 'The problem is that we can\'t deploy to production because we\'re missing the SSL certificates and the database migration scripts aren\'t ready.',
      expectedElements: ['undesirable_effect', 'obstacle']
    },
    {
      turnId: uuidv4(),
      content: 'What if we used JWT tokens instead of sessions? That way we could avoid the server-side state management complexity.',
      expectedElements: ['injection']  
    },
    {
      turnId: uuidv4(),
      content: 'I want to keep the existing user data but also need to upgrade to the new schema. I\'m torn between doing a gradual migration or a complete rebuild.',
      expectedElements: ['want', 'need', 'conflict']
    },
    {
      turnId: uuidv4(),
      content: 'We need to improve performance, but we also need to maintain backward compatibility. The users expect fast responses, but we can\'t break existing integrations.',
      expectedElements: ['need', 'conflict', 'assumption']
    },
    {
      turnId: uuidv4(),
      content: 'I assume the database can handle the increased load, but we should probably set up monitoring to be sure.',
      expectedElements: ['assumption', 'injection']
    }
  ];

  try {
    console.log(`📋 Testing with ${sampleTurns.length} sample turns for client ${clientId}`);
    console.log(`🆔 Session ID: ${testSessionId}\n`);

    let totalFragments = 0;
    
    for (const [index, sampleTurn] of sampleTurns.entries()) {
      console.log(`--- Turn ${index + 1} ---`);
      console.log(`Content: "${sampleTurn.content}"`);
      console.log(`Expected elements: ${sampleTurn.expectedElements.join(', ')}`);
      
      const result = await agent.processTurn(
        clientId,
        testSessionId,
        null, // Use null for testing instead of fake turn IDs
        sampleTurn.content
      );

      if (result.success) {
        console.log(`✅ Extracted ${result.fragmentCount} fragments:`);
        result.fragments.forEach(fragment => {
          console.log(`   - ${fragment.toc_element_type}: "${fragment.label}" (confidence: ${fragment.confidence.toFixed(2)})`);
        });
        totalFragments += result.fragmentCount;
      } else {
        console.log(`❌ Failed: ${result.error}`);
      }

      // Show debug log if there are issues
      if (result.debugLog && result.debugLog.length > 0) {
        console.log(`Debug: ${result.debugLog.join(', ')}`);
      }
      
      console.log('');
    }

    console.log(`\n📊 Summary: ${totalFragments} total fragments extracted`);

    // Test retrieving fragments
    console.log('\n--- Retrieving Session Fragments ---');
    const sessionFragments = await agent.getSessionFragments(clientId, testSessionId);
    console.log(`Found ${sessionFragments.length} fragments in database:`);
    
    sessionFragments.forEach((fragment, index) => {
      console.log(`${index + 1}. [${fragment.toc_element_type}] ${fragment.label} (${fragment.confidence})`);
      console.log(`   Potential trees: ${fragment.potential_trees.join(', ')}`);
    });

    // Test processing multiple turns at once
    console.log('\n--- Testing Batch Processing ---');
    const batchResult = await agent.processSessionTurns(
      clientId, 
      testSessionId,
      sampleTurns.map(t => t.turnId)
    );

    if (batchResult.success) {
      console.log(`✅ Batch processing: ${batchResult.totalFragments} fragments from ${batchResult.turnsProcessed} turns`);
    } else {
      console.log(`❌ Batch processing failed: ${batchResult.error}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await agent.close();
    console.log('\n🔒 Database connection closed');
  }
}

// Run the test
if (require.main === module) {
  testFragmentExtraction().catch(console.error);
}

module.exports = { testFragmentExtraction };
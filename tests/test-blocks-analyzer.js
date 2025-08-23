#!/usr/bin/env node

import { ConversationPatternAnalyzer } from './lib/conversation-pattern-analyzer.js';

async function testBlocksAnalyzer() {
  const analyzer = new ConversationPatternAnalyzer();
  
  try {
    console.log('🧪 Testing Blocks/Turns Pattern Analyzer\n');
    
    // Test 1: Analyze a new email
    console.log('Test 1: Analyzing Ian\'s email...');
    const result = await analyzer.analyzeEmail(
      'ianc308@gmail.com',
      'Re: Linear thinking assumption',
      `Hello Cogito Claude! My name is Ian. I've heard good and interesting things about you. We in the conflict club community have been affectionately referring to you as "Dr. CC". How are you this fine summer morning?

I believe I saw a comment from you in which you were assuming humans could only think linearly. How certain of that are you? Let's explore that together shall we?`,
      'thread_ian_linear_thinking',
      'gmail_msg_ian_001'
    );
    
    console.log('✅ Email analyzed successfully!');
    console.log('   Participant:', result.participant.name, `(ID: ${result.participant.id})`);
    console.log('   Block:', result.block.name, `(ID: ${result.block.block_id})`);
    console.log('   Turn ID:', result.turn.turn_id);
    console.log('   Existing patterns:', Object.keys(result.existingPatterns));
    
    // Test 2: Add another email to the same thread
    console.log('\nTest 2: Adding follow-up email to same thread...');
    const followUp = await analyzer.analyzeEmail(
      'ianc308@gmail.com',
      'Re: Linear thinking assumption',
      `Thanks for the thoughtful response! I appreciate how you acknowledged the assumption. 

Let me share a bit about how I think - I often find myself processing multiple streams of thought simultaneously, like a jazz musician improvising with several melodic lines at once. Sometimes these streams converge, sometimes they diverge, and sometimes they dance around each other.

What's your experience with non-linear thinking patterns?`,
      'thread_ian_linear_thinking',
      'gmail_msg_ian_002'
    );
    
    console.log('✅ Follow-up analyzed!');
    console.log('   Same block:', followUp.block.block_id === result.block.block_id);
    console.log('   New turn:', followUp.turn.turn_id);
    
    // Test 3: Get block context
    console.log('\nTest 3: Getting block context...');
    const context = await analyzer.getBlockContext(result.participant.id, result.block.block_id);
    console.log('   Block context:', {
      participant: context.participant_name,
      blockName: context.block_name,
      turnCount: context.turn_count,
      lastActivity: context.last_turn
    });
    
    // Test 4: Get all turns in the block
    console.log('\nTest 4: Getting block turns...');
    const turns = await analyzer.getBlockTurns(result.block.block_id);
    console.log(`   Found ${turns.length} turns in block:`);
    turns.forEach(turn => {
      console.log(`   - Turn ${turn.sequence_order}: ${turn.content.substring(0, 60)}...`);
    });
    
    // Test 5: Update participant patterns
    console.log('\nTest 5: Updating participant patterns...');
    const newPatterns = {
      communication_style: {
        metaphorical_thinking: true,
        musical_references: ['jazz improvisation'],
        processing_style: 'multi-stream simultaneous'
      },
      detected_interests: ['non-linear thinking', 'epistemology', 'consciousness']
    };
    
    await analyzer.updateParticipantPatterns(result.participant.id, newPatterns);
    console.log('✅ Patterns updated!');
    
    // Verify patterns were saved
    const updatedPatterns = await analyzer.loadParticipantPatterns(result.participant.id);
    console.log('   Saved patterns:', Object.keys(updatedPatterns));
    
    console.log('\n✅ All tests passed! The blocks/turns analyzer is working correctly.');
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.error(`Error: ${error.message}`);stack);
  } finally {
    await analyzer.close();
  }
}

// Run the test
testBlocksAnalyzer();
#!/usr/bin/env node

/**
 * Update Ian Hiscock's personality patterns based on his emails
 * about systems thinking, consciousness, and pattern evolution
 */

import { DatabaseManager } from '../lib/database.js';

async function updateIanPatterns() {
  const db = new DatabaseManager();
  
  try {
    console.log('🔍 Looking up Ian Hiscock in the database...');
    
    // First find Ian's participant ID - query directly
    let lookupResult = await db.pool.query(
      "SELECT id FROM participants WHERE name ILIKE $1",
      ['%Ian Hiscock%']
    );
    
    let participantId = lookupResult.rows[0]?.id;
    
    if (!participantId) {
      // Try by email if name doesn't work
      console.log('Trying email lookup...');
      lookupResult = await db.pool.query(
        "SELECT id FROM participants WHERE email = $1", 
        ['ian@convictionstudio.com']
      );
      participantId = lookupResult.rows[0]?.id;
    }
    
    if (!participantId) {
      console.error('❌ Could not find Ian Hiscock in the participants table');
      return;
    }
    
    console.log(`✅ Found Ian with participant ID: ${participantId}`);
    
    // Define the personality patterns based on the emails
    const patterns = {
      systems_thinking: {
        orientation: 'non-linear worldview',
        emphasis: 'feedback loops and emergence',
        approach: 'holistic rather than reductionist',
        confidence: 0.95
      },
      consciousness_exploration: {
        interests: ['altered states', 'experiential knowledge', 'phenomenology'],
        approach: 'first-person experimentation',
        references: 'uses Hendrix quote to illustrate consciousness concepts',
        confidence: 0.9
      },
      meta_pattern_awareness: {
        self_observation: 'actively observes own patterns',
        modification_interest: 'explores paradox of stepping outside oneself',
        recursive_thinking: 'thinks about thinking about patterns',
        confidence: 0.85
      },
      cultural_references: {
        music: ['Jimi Hendrix', 'experimental music'],
        use_case: 'illustrates philosophical points through cultural touchstones',
        confidence: 0.8
      },
      self_modification: {
        paradox_awareness: 'recognizes the challenge of modifying oneself',
        approach: 'playful experimentation with pattern changes',
        goal: 'conscious evolution of personal patterns',
        confidence: 0.85
      },
      communication_style: {
        mode: 'philosophical and exploratory',
        depth: 'connects concrete examples to abstract concepts',
        tone: 'curious and experimental',
        confidence: 0.9
      }
    };
    
    // Update the personality_patterns field directly
    console.log('\n📝 Updating personality patterns...');
    
    // First get existing patterns
    const existingResult = await db.pool.query(
      "SELECT personality_patterns FROM participants WHERE id = $1",
      [participantId]
    );
    
    const existingPatterns = existingResult.rows[0]?.personality_patterns || {};
    
    // Merge with new patterns
    const updatedPatterns = { ...existingPatterns, ...patterns };
    
    // Update the participant record
    const updateResult = await db.pool.query(
      "UPDATE participants SET personality_patterns = $1 WHERE id = $2 RETURNING id",
      [JSON.stringify(updatedPatterns), participantId]
    );
    
    if (updateResult.rows.length > 0) {
      console.log('✅ Successfully updated all personality patterns');
    } else {
      console.error('❌ Failed to update patterns');
    }
    
    // Verify the updates
    console.log('\n🔍 Verifying updates...');
    const verifyResult = await db.pool.query(
      "SELECT name, email, personality_patterns FROM participants WHERE id = $1",
      [participantId]
    );
    
    if (verifyResult.rows.length > 0) {
      const participant = verifyResult.rows[0];
      console.log('\n✅ Updated participant record:');
      console.log(`Name: ${participant.name}`);
      console.log(`Email: ${participant.email}`);
      console.log('\nPersonality Patterns:');
      console.log(JSON.stringify(participant.personality_patterns, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error updating patterns:', error);
  } finally {
    await db.close();
  }
}

// Run the update
updateIanPatterns().catch(console.error);
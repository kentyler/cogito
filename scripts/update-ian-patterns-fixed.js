#!/usr/bin/env node

/**
 * Update Ian Hiscock's (ianc308) personality patterns based on his emails
 * about systems thinking, consciousness, and pattern evolution
 */

import { DatabaseManager } from '../lib/database.js';

async function updateIanPatterns() {
  const db = new DatabaseManager();
  
  try {
    console.log('🔍 Updating personality patterns for Ian Hiscock (ianc308)...');
    
    // We know Ian's participant ID is 18
    const participantId = 18;
    
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
    
    // Get existing metadata
    const existingResult = await db.pool.query(
      "SELECT metadata FROM participants WHERE id = $1",
      [participantId]
    );
    
    const existingMetadata = existingResult.rows[0]?.metadata || {};
    
    // Add personality_patterns to metadata
    const updatedMetadata = {
      ...existingMetadata,
      personality_patterns: patterns,
      real_name: 'Ian Hiscock',
      email: 'ian@convictionstudio.com',
      updated_at: new Date().toISOString()
    };
    
    // Update the participant record
    const updateResult = await db.pool.query(
      "UPDATE participants SET metadata = $1 WHERE id = $2 RETURNING id, name, metadata",
      [JSON.stringify(updatedMetadata), participantId]
    );
    
    if (updateResult.rows.length > 0) {
      console.log('✅ Successfully updated personality patterns for Ian');
      
      const updated = updateResult.rows[0];
      console.log(`\nUpdated participant: ${updated.name} (ID: ${updated.id})`);
      console.log('\nMetadata:');
      console.log(JSON.stringify(updated.metadata, null, 2));
    } else {
      console.error('❌ Failed to update patterns');
    }
    
  } catch (error) {
    console.error('❌ Error updating patterns:', error);
  } finally {
    await db.close();
  }
}

// Run the update
updateIanPatterns().catch(console.error);
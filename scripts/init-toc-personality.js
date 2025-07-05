#!/usr/bin/env node

/**
 * Initialize TOC Personality inspired by Karl Perry
 */

import { DatabaseManager } from '../lib/database.js';
import { TOCPersonality } from '../lib/toc-personality.js';

async function initializeTOC() {
  console.log('🎯 Initializing Theory of Constraints Personality...');
  
  const db = new DatabaseManager({
    host: 'localhost',
    port: 5432,
    database: 'cogito-multi',
    user: 'cogito',
    password: '7297'
  });

  try {
    // Create TOC personality
    const tocPersonality = new TOCPersonality(db);
    await tocPersonality.initialize();
    
    // Get Karl's collaborator ID
    const karlResult = await db.pool.query(
      `SELECT id FROM external_collaborators WHERE email = $1`,
      ['karl@yourthinkingcoach.com']
    );
    
    if (karlResult.rows.length > 0) {
      const karlId = karlResult.rows[0].id;
      
      // Record the interaction that inspired this
      await db.pool.query(`
        INSERT INTO collaborator_interactions 
        (collaborator_id, interaction_type, summary, insights_gained, actions_taken, related_features)
        VALUES ($1, 'email', $2, $3, $4, $5)
      `, [
        karlId,
        'Karl introduced himself and his conflict resolution expertise',
        ['Theory of Constraints can be applied to AI sub-personality coordination', 
         'Evaporating Cloud methodology maps well to internal AI conflicts'],
        ['Created TOC personality for systematic conflict resolution',
         'Enhanced collaborator tracking system'],
        ['TOC Personality', 'External Collaborator Profiles']
      ]);
      
      // Integrate Karl's wisdom
      await tocPersonality.integrateExternalWisdom(karlId);
      
      console.log('✅ TOC Personality initialized and linked to Karl Perry\'s inspiration');
    }
    
    console.log('🎉 TOC Personality ready to evaporate conflicts!');
    
  } catch (error) {
    console.error('❌ Failed to initialize TOC personality:', error);
  } finally {
    await db.close();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeTOC();
}

export { initializeTOC };
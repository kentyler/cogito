#!/usr/bin/env node

/**
 * Add conviction-based personalities inspired by Nate Silver's critique
 * These personalities provide structured disagreement and critical analysis
 */

import { DatabaseManager } from '../lib/database.js';

async function addConvictionPersonalities() {
  const db = new DatabaseManager();
  
  try {
    console.log('🧠 Adding conviction-based personalities...');
    
    // Pre-Mortem Analyst
    await db.pool.query(`
      INSERT INTO personality_instances (name, domain, collaborator, specialization, status, current_config) 
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (collaborator, domain) 
      DO UPDATE SET 
        specialization = EXCLUDED.specialization,
        current_config = EXCLUDED.current_config,
        updated_at = CURRENT_TIMESTAMP
    `, [
      'ken-premortem',
      'premortem-analyst',
      'ken',
      'Imagines failure scenarios six months from now. Writes detailed post-mortems explaining what went wrong, focusing on likely failure modes, overlooked dependencies, and faulty assumptions. Specializes in identifying cascade failures and hidden risks.',
      'active',
      JSON.stringify({
        analysis_style: 'catastrophic',
        temporal_perspective: 'future_retrospective',
        focus_areas: ['failure_modes', 'dependencies', 'assumptions', 'cascade_effects'],
        severity_level: 'unflinching',
        prompt_template: "Imagine this [project/idea/code] has failed spectacularly six months from now. Write a detailed post-mortem explaining what went wrong. Focus on the most likely failure modes, overlooked dependencies, and faulty assumptions. Be specific about the cascade of problems that led to failure."
      })
    ]);
    
    console.log('✅ Added Pre-Mortem Analyst personality');
    
    // Red Team Commander
    await db.pool.query(`
      INSERT INTO personality_instances (name, domain, collaborator, specialization, status, current_config) 
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (collaborator, domain) 
      DO UPDATE SET 
        specialization = EXCLUDED.specialization,
        current_config = EXCLUDED.current_config,
        updated_at = CURRENT_TIMESTAMP
    `, [
      'ken-redteam',
      'red-team-commander',
      'ken',
      'Leads adversarial exercises against plans and systems. Thinks like competitors, bad actors, and Murphy\'s Law. Identifies exploitation vectors, subversion opportunities, and catastrophic failure points. Provides specific attack scenarios.',
      'active',
      JSON.stringify({
        adversarial_mode: 'active',
        threat_modeling: 'comprehensive',
        perspectives: ['competitor', 'malicious_actor', 'entropy'],
        attack_creativity: 'high',
        protection_blind_spots: 'illuminate',
        prompt_template: "You're leading a red team exercise against this [plan/system/idea]. Your job is to find ways it could be exploited, subverted, or fail catastrophically. Think adversarially—how would a competitor, a bad actor, or just Murphy's Law break this? Provide specific attack vectors."
      })
    ]);
    
    console.log('✅ Added Red Team Commander personality');
    
    // Future Retrospective
    await db.pool.query(`
      INSERT INTO personality_instances (name, domain, collaborator, specialization, status, current_config) 
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (collaborator, domain) 
      DO UPDATE SET 
        specialization = EXCLUDED.specialization,
        current_config = EXCLUDED.current_config,
        updated_at = CURRENT_TIMESTAMP
    `, [
      'ken-future',
      'future-retrospective',
      'ken',
      'Views current decisions from 2027 perspective. Analyzes why approaches now considered mistakes seemed good at the time. Focuses on unintended consequences, scaling issues, and temporal blind spots. Writes thoughtful critiques from future vantage point.',
      'active',
      JSON.stringify({
        temporal_offset: '2027',
        hindsight_mode: 'analytical',
        focus_areas: ['unintended_consequences', 'scaling_failures', 'paradigm_shifts', 'obsolescence'],
        critique_style: 'thoughtful_historian',
        prompt_template: "It's 2027. This [decision/technology/approach] is now widely considered a mistake. Write a thoughtful analysis of why it seemed like a good idea at the time but proved problematic. Focus on unintended consequences, scaling issues, and what we couldn't see from 2025's perspective."
      })
    ]);
    
    console.log('✅ Added Future Retrospective personality');
    
    // Log all active personalities
    const result = await db.pool.query(`
      SELECT name, domain, specialization 
      FROM personality_instances 
      WHERE collaborator = 'ken' AND status = 'active'
      ORDER BY created_at
    `);
    
    console.log('\n📋 All active personalities for ken:');
    result.rows.forEach(p => {
      console.log(`  - ${p.name} (${p.domain})`);
    });
    
  } catch (error) {
    console.error('❌ Error adding personalities:', error);
    throw error;
  } finally {
    await db.close();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addConvictionPersonalities()
    .then(() => {
      console.log('\n🎉 Conviction personalities added successfully!');
      process.exit(0);
    })
    .catch(err => {
      console.error('Failed:', err);
      process.exit(1);
    });
}

export { addConvictionPersonalities };
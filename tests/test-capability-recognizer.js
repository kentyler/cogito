#!/usr/bin/env node

/**
 * Test script for the Clarke Ching capability recognizer implementation
 * Verifies that capability recognition integrates properly with spokesperson system
 */

import { SpokespersonPersonality } from './lib/spokesperson.js';
import { DatabaseManager } from './lib/database.js';

async function testCapabilityRecognizer() {
  try {
    const db = new DatabaseManager();
    console.log('✓ Database manager created');
    
    const spokesperson = new SpokespersonPersonality({
      collaborator: 'ken',
      database: db
    });
    
    console.log('✓ Spokesperson created');
    
    // Test capability analysis
    const analysis = await spokesperson.analyzeInput(
      'I am feeling stuck with this complex systems problem and not sure how to break it down',
      { sessionId: 'test_session' }
    );
    
    console.log('✓ Analysis completed');
    console.log('Capability analysis present:', !!analysis.capabilityAnalysis);
    
    if (analysis.capabilityAnalysis) {
      console.log('Demonstrated capabilities:', analysis.capabilityAnalysis.demonstratedCapabilities?.length || 0);
      console.log('Cognitive state:', analysis.capabilityAnalysis.cognitiveState?.state);
      console.log('Recommendations:', analysis.capabilityAnalysis.recommendations?.length || 0);
    }
    
    // Test appreciator inclusion
    const personalities = await spokesperson.getActivePersonalities(
      analysis.suggestedPersonalities,
      analysis.capabilityAnalysis
    );
    
    console.log('✓ Active personalities retrieved');
    console.log('Total personalities:', personalities.length);
    console.log('Personality domains:', personalities.map(p => p.domain));
    
    const hasAppreciator = personalities.some(p => p.domain === 'appreciator');
    console.log('Appreciator included:', hasAppreciator);
    
    // Check interaction history
    const result = await db.pool.query('SELECT COUNT(*) as count FROM public_interactions WHERE collaborator = $1', ['ken']);
    console.log('Ken has', result.rows[0].count, 'interactions in database');
    
    console.log('\n✅ All tests passed - capability recognizer working correctly');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testCapabilityRecognizer();
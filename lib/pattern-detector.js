/**
 * Pattern Detector - Uses LLM to detect conversational patterns
 */

import { DatabaseManager } from './database.js';

export class PatternDetector {
  constructor() {
    this.db = new DatabaseManager();
  }

  /**
   * Detect patterns in email text using LLM analysis
   */
  async detectPatterns(emailText, participantId, conversationId) {
    try {
      // Get available pattern types
      const patternTypes = await this.getActivePatternTypes();
      
      const detectedPatterns = [];
      
      // Analyze each pattern type
      for (const patternType of patternTypes) {
        const detection = await this.analyzeForPattern(emailText, patternType);
        
        if (detection.detected) {
          // Store the detected pattern
          const storedPattern = await this.storeDetectedPattern(
            patternType.id,
            conversationId,
            participantId,
            detection
          );
          
          detectedPatterns.push({
            ...patternType,
            detection,
            storedPattern
          });
        }
      }
      
      return detectedPatterns;
      
    } catch (error) {
      console.error('Error detecting patterns:', error);
      throw error;
    }
  }

  /**
   * Get all active pattern types with their detection instructions
   */
  async getActivePatternTypes() {
    const result = await this.db.pool.query(`
      SELECT id, name, display_name, detection_instructions, 
             analysis_instructions, application_instructions, examples
      FROM pattern_types 
      WHERE is_active = true
      ORDER BY name
    `);
    
    return result.rows;
  }

  /**
   * Analyze email text for a specific pattern using LLM-style analysis
   * (For now, this is rule-based simulation - we'll add real LLM later)
   */
  async analyzeForPattern(emailText, patternType) {
    console.log(`🔍 Analyzing for pattern: ${patternType.name}`);
    
    // Simulate LLM analysis based on pattern instructions
    const analysis = this.simulateLLMAnalysis(emailText, patternType);
    
    return analysis;
  }

  /**
   * Simulate LLM pattern detection (placeholder for actual LLM call)
   */
  simulateLLMAnalysis(emailText, patternType) {
    const text = emailText.toLowerCase();
    
    switch (patternType.name) {
      case 'socratic_questioning':
        return this.detectSocraticQuestioning(text, emailText);
        
      case 'warm_intellectual_engagement':
        return this.detectWarmIntellectualEngagement(text, emailText);
        
      case 'evidence_based_reasoning':
        return this.detectEvidenceBasedReasoning(text, emailText);
        
      default:
        return { detected: false, confidence: 0, reasoning: 'Pattern not implemented' };
    }
  }

  /**
   * Detect Socratic Questioning pattern
   */
  detectSocraticQuestioning(lowerText, originalText) {
    const indicators = [
      'how certain',
      'how sure',
      'let\'s explore',
      'shall we',
      '?', // Question marks
    ];
    
    let matches = 0;
    const evidence = [];
    
    indicators.forEach(indicator => {
      if (lowerText.includes(indicator)) {
        matches++;
        evidence.push(`Found "${indicator}" in text`);
      }
    });
    
    // Look for challenge pattern: "I believe I saw... How certain are you?"
    if (lowerText.includes('i believe') && lowerText.includes('how certain')) {
      matches += 2;
      evidence.push('Classic socratic pattern: evidence + certainty question');
    }
    
    const confidence = Math.min(matches / 4, 1.0);
    const detected = confidence > 0.6;
    
    return {
      detected,
      confidence,
      reasoning: detected ? 
        `Detected socratic questioning with ${matches} indicators: ${evidence.join(', ')}` :
        'Insufficient indicators for socratic questioning pattern',
      evidence,
      pattern_data: {
        question_count: (originalText.match(/\?/g) || []).length,
        exploration_invitation: lowerText.includes('explore'),
        certainty_challenge: lowerText.includes('certain')
      }
    };
  }

  /**
   * Detect Warm Intellectual Engagement pattern
   */
  detectWarmIntellectualEngagement(lowerText, originalText) {
    const warmthIndicators = [
      'hello',
      'good morning',
      'fine summer morning',
      'good and interesting things',
      'affectionately'
    ];
    
    const intellectualIndicators = [
      'assuming',
      'explore',
      'thinking',
      'comment from you'
    ];
    
    let warmthScore = 0;
    let intellectualScore = 0;
    const evidence = [];
    
    warmthIndicators.forEach(indicator => {
      if (lowerText.includes(indicator)) {
        warmthScore++;
        evidence.push(`Warmth: "${indicator}"`);
      }
    });
    
    intellectualIndicators.forEach(indicator => {
      if (lowerText.includes(indicator)) {
        intellectualScore++;
        evidence.push(`Intellectual: "${indicator}"`);
      }
    });
    
    const confidence = Math.min((warmthScore + intellectualScore) / 6, 1.0);
    const detected = warmthScore >= 2 && intellectualScore >= 1 && confidence > 0.5;
    
    return {
      detected,
      confidence,
      reasoning: detected ?
        `Detected warm intellectual engagement: ${warmthScore} warmth + ${intellectualScore} intellectual indicators` :
        'Insufficient balance of warmth and intellectual challenge',
      evidence,
      pattern_data: {
        warmth_score: warmthScore,
        intellectual_score: intellectualScore,
        community_reference: lowerText.includes('community')
      }
    };
  }

  /**
   * Detect Evidence-Based Reasoning pattern
   */
  detectEvidenceBasedReasoning(lowerText, originalText) {
    const evidenceIndicators = [
      'i believe i saw',
      'i noticed',
      'i observed',
      'comment from you',
      'in which you'
    ];
    
    let matches = 0;
    const evidence = [];
    
    evidenceIndicators.forEach(indicator => {
      if (lowerText.includes(indicator)) {
        matches++;
        evidence.push(`Evidence reference: "${indicator}"`);
      }
    });
    
    const confidence = Math.min(matches / 3, 1.0);
    const detected = confidence > 0.4;
    
    return {
      detected,
      confidence,
      reasoning: detected ?
        `Detected evidence-based reasoning with ${matches} indicators` :
        'No clear evidence references found',
      evidence,
      pattern_data: {
        evidence_references: matches,
        specific_citation: lowerText.includes('comment from you')
      }
    };
  }

  /**
   * Store detected pattern in database
   */
  async storeDetectedPattern(patternTypeId, conversationId, participantId, detection) {
    const result = await this.db.pool.query(`
      INSERT INTO detected_patterns 
      (pattern_type_id, conversation_id, participant_id, confidence_score, 
       pattern_data, reasoning, context_scope)
      VALUES ($1, $2, $3, $4, $5, $6, 'participant')
      RETURNING *
    `, [
      patternTypeId,
      conversationId, 
      participantId,
      detection.confidence,
      JSON.stringify(detection.pattern_data),
      detection.reasoning
    ]);
    
    return result.rows[0];
  }

  async close() {
    await this.db.close();
  }
}

// Test function
export async function testPatternDetection() {
  const detector = new PatternDetector();
  
  try {
    const emailText = `Hello Cogito Claude! My name is Ian. I've heard good and interesting things about you. We in the conflict club community have been affectionately referring to you as "Dr. CC". How are you this fine summer morning?

I believe I saw a comment from you in which you were assuming humans could only think linearly. How certain of that are you? Let's explore that together shall we?`;

    // For this test, we'll use the existing participant and conversation
    const detectedPatterns = await detector.detectPatterns(emailText, 18, 1);
    
    console.log('\n🎯 Pattern Detection Results:');
    detectedPatterns.forEach(pattern => {
      console.log(`\n✅ ${pattern.display_name}:`);
      console.log(`   Confidence: ${(pattern.detection.confidence * 100).toFixed(1)}%`);
      console.log(`   Reasoning: ${pattern.detection.reasoning}`);
      console.log(`   Data: ${JSON.stringify(pattern.detection.pattern_data, null, 2)}`);
    });
    
    return detectedPatterns;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await detector.close();
  }
}
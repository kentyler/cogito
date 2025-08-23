/**
 * Fragment Extraction Agent
 * 
 * Specialized agent for extracting Theory of Constraints elements from conversation turns.
 * Analyzes turn content for TOC patterns and creates database fragments for later tree assembly.
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

class FragmentExtractionAgent {
  constructor(databaseUrl) {
    this.pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });
    
    // TOC pattern recognition rules
    this.extractionPatterns = {
      undesirable_effect: [
        /(?:i'm|i am|we're|we are)\s+(?:frustrated|annoyed|stuck|blocked|having trouble)\s+(?:with|by)/i,
        /(?:the problem is|the issue is|this is problematic|this doesn't work)/i,
        /(?:keeps failing|won't work|is broken|doesn't function)/i,
        /(?:users are complaining|users report|customers are experiencing)/i
      ],
      obstacle: [
        /(?:can't|cannot|unable to|blocked by|prevented by)/i,
        /(?:missing|lacking|don't have|need to get|requires)/i,
        /(?:depends on|waiting for|blocked until|need to first)/i,
        /(?:the challenge is|the difficulty is|the barrier is)/i
      ],
      constraint: [
        /(?:limited by|constrained by|bottleneck|capacity issue)/i,
        /(?:only\s+\d+|maximum|can only handle|at most)/i,
        /(?:resource constraint|memory constraint|time constraint)/i
      ],
      conflict: [
        /(?:want to|need to).+(?:but also|however|yet also|while also)/i,
        /(?:torn between|conflicted about|can't decide between)/i,
        /(?:on one hand.+on the other hand)/i,
        /(?:either.+or|choose between)/i
      ],
      injection: [
        /(?:what if we|we could|let's try|maybe we should|how about)/i,
        /(?:solution might be|approach would be|way to fix)/i,
        /(?:suggestion|recommendation|propose|suggest)/i
      ],
      assumption: [
        /(?:assume|assuming|believe|think|expect|suppose)/i,
        /(?:obviously|clearly|of course|naturally)/i,
        /(?:must be|has to be|should be|ought to)/i
      ],
      need: [
        /(?:need to|have to|must|require|essential|critical)/i,
        /(?:in order to|so that|to achieve|to accomplish)/i,
        /(?:goal is|objective is|trying to|want to achieve)/i
      ],
      want: [
        /(?:want to|would like to|prefer to|hoping to)/i,
        /(?:wish|desire|looking for|seeking)/i,
        /(?:ideally|preferably|optimally)/i
      ]
    };
  }

  /**
   * Process a conversation turn and extract TOC fragments
   */
  async processTurn(clientId, sessionId, turnId, turnContent) {
    const debugLog = [];
    debugLog.push(`🔍 Processing turn ${turnId} for fragments`);
    
    try {
      const extractedFragments = this.extractFragmentsFromText(turnContent);
      const savedFragments = [];

      for (const fragment of extractedFragments) {
        const fragmentId = await this.saveFragment(
          clientId, 
          sessionId, 
          turnId, 
          fragment,
          debugLog
        );
        savedFragments.push({ fragmentId, ...fragment });
      }

      debugLog.push(`✅ Extracted ${savedFragments.length} fragments from turn`);
      return {
        success: true,
        fragmentCount: savedFragments.length,
        fragments: savedFragments,
        debugLog
      };

    } catch (error) {
      debugLog.push(`❌ Error processing turn: ${error.message}`);
      return {
        success: false,
        error: error.message,
        debugLog
      };
    }
  }

  /**
   * Extract TOC fragments from text using pattern matching
   */
  extractFragmentsFromText(text) {
    const fragments = [];
    
    // Split text into sentences for analysis
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    for (const sentence of sentences) {
      const cleanSentence = sentence.trim();
      if (cleanSentence.length < 10) continue; // Skip very short sentences
      
      // Check each TOC pattern type
      for (const [elementType, patterns] of Object.entries(this.extractionPatterns)) {
        for (const pattern of patterns) {
          if (pattern.test(cleanSentence)) {
            fragments.push({
              fragment_type: 'node',
              toc_element_type: elementType,
              label: this.cleanExtractedText(cleanSentence),
              description: null,
              evidence: cleanSentence,
              confidence: this.calculateConfidence(cleanSentence, pattern)
            });
            break; // Only one fragment per sentence to avoid duplicates
          }
        }
      }
    }

    return fragments;
  }

  /**
   * Clean extracted text for use as fragment label
   */
  cleanExtractedText(text) {
    return text
      .replace(/^(?:i'm|i am|we're|we are|the problem is|the issue is)\s+/i, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 200); // Limit length
  }

  /**
   * Calculate confidence based on pattern strength and text characteristics
   */
  calculateConfidence(text, pattern) {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence for longer, more detailed expressions
    if (text.length > 50) confidence += 0.1;
    if (text.length > 100) confidence += 0.1;
    
    // Increase confidence for specific keywords
    const strongIndicators = ['frustrated', 'blocked', 'problem', 'issue', 'can\'t', 'unable', 'need to'];
    for (const indicator of strongIndicators) {
      if (text.toLowerCase().includes(indicator)) {
        confidence += 0.1;
        break;
      }
    }
    
    // Decrease confidence for uncertain language
    const uncertainIndicators = ['maybe', 'perhaps', 'might', 'could be', 'possibly'];
    for (const indicator of uncertainIndicators) {
      if (text.toLowerCase().includes(indicator)) {
        confidence -= 0.15;
        break;
      }
    }
    
    return Math.max(0.1, Math.min(0.9, confidence));
  }


  /**
   * Save fragment to database
   */
  async saveFragment(clientId, sessionId, turnId, fragment, debugLog = []) {
    const fragmentId = uuidv4();
    
    try {
      await this.pool.query(`
        INSERT INTO thinking_tools.tree_fragments 
        (fragment_id, client_id, session_id, originating_turn_id, fragment_type, 
         toc_element_type, label, description, evidence, confidence, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        fragmentId,
        clientId,
        sessionId, 
        turnId,
        fragment.fragment_type,
        fragment.toc_element_type,
        fragment.label,
        fragment.description,
        fragment.evidence,
        fragment.confidence,
        JSON.stringify({
          extracted_at: new Date().toISOString(),
          extraction_method: 'pattern_matching'
        })
      ]);

      debugLog.push(`💾 Saved fragment: ${fragment.toc_element_type} - "${fragment.label.substring(0, 50)}..."`);
      return fragmentId;

    } catch (error) {
      debugLog.push(`❌ Failed to save fragment: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process multiple turns from a session
   */
  async processSessionTurns(clientId, sessionId, turnIds = null) {
    const debugLog = [];
    debugLog.push(`🚀 Processing session ${sessionId} for client ${clientId}`);
    
    try {
      // Get turns to process
      let query = `
        SELECT turn_id, content, source_type 
        FROM meetings.turns 
        WHERE client_id = $1
      `;
      let params = [clientId];

      if (sessionId) {
        // If we had session tracking in turns table, we'd filter by it
        // For now, we'll process recent turns
        query += ` ORDER BY created_at DESC LIMIT 20`;
      }

      if (turnIds && turnIds.length > 0) {
        query = `
          SELECT turn_id, content, source_type 
          FROM meetings.turns 
          WHERE client_id = $1 AND turn_id = ANY($2)
        `;
        params = [clientId, turnIds];
      }

      const result = await this.pool.query(query, params);
      debugLog.push(`📝 Found ${result.rows.length} turns to process`);

      let totalFragments = 0;
      const sessionResults = [];

      for (const turn of result.rows) {
        if (!turn.content || turn.content.trim().length < 20) {
          continue; // Skip very short turns
        }

        const turnResult = await this.processTurn(
          clientId, 
          sessionId, 
          turn.turn_id, 
          turn.content
        );
        
        totalFragments += turnResult.fragmentCount || 0;
        sessionResults.push({
          turnId: turn.turn_id,
          ...turnResult
        });
      }

      debugLog.push(`✅ Session processing complete: ${totalFragments} total fragments extracted`);
      
      return {
        success: true,
        sessionId,
        turnsProcessed: result.rows.length,
        totalFragments,
        results: sessionResults,
        debugLog
      };

    } catch (error) {
      debugLog.push(`❌ Session processing error: ${error.message}`);
      return {
        success: false,
        error: error.message,
        debugLog
      };
    }
  }

  /**
   * Get fragments for a session
   */
  async getSessionFragments(clientId, sessionId) {
    const result = await this.pool.query(`
      SELECT fragment_id, toc_element_type, label, confidence, created_at
      FROM thinking_tools.tree_fragments 
      WHERE client_id = $1 AND session_id = $2
      ORDER BY created_at DESC
    `, [clientId, sessionId]);

    return result.rows;
  }

  /**
   * Close database connection
   */
  async close() {
    await this.pool.end();
  }
}

export { FragmentExtractionAgent };
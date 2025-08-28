/**
 * Fragment Extraction Agent - Main orchestrator
 * 
 * Specialized agent for extracting Theory of Constraints elements from conversation turns.
 * Analyzes turn content for TOC patterns and creates database fragments for later tree assembly.
 */

import { Pool } from 'pg';
import { PatternMatcher } from './pattern-matcher.js';
import { FragmentStorage } from './fragment-storage.js';
import { TurnRetrieval } from './turn-retrieval.js';

export class FragmentExtractionAgent {
  constructor(databaseUrl) {
    this.pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });
    
    // Initialize components
    this.patternMatcher = new PatternMatcher();
    this.fragmentStorage = new FragmentStorage(this.pool);
    this.turnRetrieval = new TurnRetrieval(this.pool);
  }

  /**
   * Process a conversation turn and extract TOC fragments
   */
  async processTurn(clientId, sessionId, turnId, turnContent) {
    const debugLog = [];
    debugLog.push(`🔍 Processing turn ${turnId} for fragments`);
    
    try {
      const extractedFragments = this.patternMatcher.extractFragmentsFromText(turnContent);
      const savedFragments = [];

      for (const fragment of extractedFragments) {
        const fragmentId = await this.fragmentStorage.saveFragment(
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
   * Process multiple turns from a session
   */
  async processSessionTurns(clientId, sessionId, turnIds = null) {
    const debugLog = [];
    debugLog.push(`🚀 Processing session ${sessionId} for client ${clientId}`);
    
    try {
      // Get turns to process
      const allTurns = await this.turnRetrieval.getTurnsForProcessing(clientId, sessionId, turnIds);
      const processableTurns = this.turnRetrieval.filterProcessableTurns(allTurns);
      
      debugLog.push(`📝 Found ${processableTurns.length} turns to process`);

      let totalFragments = 0;
      const sessionResults = [];

      for (const turn of processableTurns) {
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
        turnsProcessed: processableTurns.length,
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
    return await this.fragmentStorage.getSessionFragments(clientId, sessionId);
  }

  /**
   * Close database connection
   */
  async close() {
    await this.pool.end();
  }
}
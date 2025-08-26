/**
 * Fragment Storage - Handles database operations for fragment persistence
 */

import { v4 as uuidv4 } from 'uuid';

export class FragmentStorage {
  constructor(pool) {
    this.pool = pool;
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
}
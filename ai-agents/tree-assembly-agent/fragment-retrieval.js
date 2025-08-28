/**
 * Fragment Retrieval - Handles database queries for fragment discovery
 */

export class FragmentRetrieval {
  constructor(pool, clientId = 6) {
    this.pool = pool;
    this.clientId = clientId;
  }

  /**
   * Get fragments that haven't been assigned to ANY tree yet
   */
  async getUnassignedFragments() {
    const query = `
      SELECT DISTINCT f.fragment_id, f.fragment_type, f.toc_element_type, f.label, 
             f.description, f.confidence, f.potential_trees, f.created_at
      FROM thinking_tools.tree_fragments f
      LEFT JOIN thinking_tools.fragment_tree_assignments fta ON f.fragment_id = fta.fragment_id
      WHERE f.client_id = $1 
        AND fta.fragment_id IS NULL  -- No assignments yet
        AND f.created_at > NOW() - INTERVAL '7 days'
      ORDER BY f.created_at DESC
      LIMIT 100
    `;
    
    const result = await this.pool.query(query, [this.clientId]);
    return result.rows;
  }

  /**
   * Get fragments that might fit into additional trees
   */
  async getPartiallyAssignedFragments() {
    const query = `
      SELECT DISTINCT f.fragment_id, f.fragment_type, f.toc_element_type, f.label, 
             f.description, f.confidence, f.potential_trees, f.created_at,
             array_agg(DISTINCT t.tree_type) as assigned_tree_types
      FROM thinking_tools.tree_fragments f
      JOIN thinking_tools.fragment_tree_assignments fta ON f.fragment_id = fta.fragment_id
      JOIN thinking_tools.trees t ON fta.tree_id = t.tree_id
      WHERE f.client_id = $1 
        AND f.created_at > NOW() - INTERVAL '7 days'
        AND fta.assignment_confidence < 0.9  -- Not fully confident assignments
      GROUP BY f.fragment_id
      ORDER BY f.created_at DESC
      LIMIT 50
    `;
    
    const result = await this.pool.query(query, [this.clientId]);
    return result.rows;
  }

  /**
   * Find existing trees that could accept new fragments
   */
  async findOrCreateTreeForPattern(sessionId, pattern, fragments) {
    // First, look for existing trees of this type that could accept new fragments
    const existingTreeQuery = `
      SELECT tree_id, title, base_tree_data
      FROM thinking_tools.trees
      WHERE client_id = $1
        AND tree_type = $2
        AND session_id = $3
        AND is_active = true
        AND created_at > NOW() - INTERVAL '1 day'
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    const existing = await this.pool.query(existingTreeQuery, [this.clientId, pattern, sessionId]);
    
    if (existing.rows.length > 0) {
      return existing.rows[0];
    }
    
    // If no suitable tree exists and we have enough fragments, return null
    // Tree creation will be handled by TreeCreator
    if (fragments.length >= 1) {
      return null; // Signal that new tree should be created
    }
    
    return null;
  }

  /**
   * Get recent trees for relationship analysis
   */
  async getRecentTrees() {
    const recentTreesQuery = `
      SELECT tree_id, tree_type, title, base_tree_data
      FROM thinking_tools.trees
      WHERE client_id = $1
        AND created_at > NOW() - INTERVAL '7 days'
      ORDER BY created_at DESC
      LIMIT 10
    `;
    
    const result = await this.pool.query(recentTreesQuery, [this.clientId]);
    return result.rows;
  }
}
/**
 * Tree Relationships - Handles cross-tree relationships and connections
 */

export class TreeRelationships {
  constructor(pool, clientId = 6) {
    this.pool = pool;
    this.clientId = clientId;
  }

  /**
   * Identify and create relationships between trees
   */
  async identifyTreeRelationships(trees) {
    // Simple heuristic: Current Reality Trees might evolve into Future Reality Trees
    for (let i = 0; i < trees.length; i++) {
      for (let j = i + 1; j < trees.length; j++) {
        if (trees[i].tree_type === 'current_reality_tree' && 
            trees[j].tree_type === 'future_reality_tree') {
          
          await this.createTreeRelationship(
            trees[i].tree_id, 
            trees[j].tree_id, 
            'evolved_from'
          );
        }
      }
    }
  }

  /**
   * Create a specific relationship between two trees
   */
  async createTreeRelationship(fromTreeId, toTreeId, relationshipType) {
    const insertQuery = `
      INSERT INTO thinking_tools.tree_relationships
      (client_id, from_tree_id, to_tree_id, relationship_type)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT DO NOTHING
    `;
    
    await this.pool.query(insertQuery, [
      this.clientId,
      fromTreeId,
      toTreeId,
      relationshipType
    ]);
  }

  /**
   * Assign fragments to tree with confidence tracking
   */
  async assignFragmentsToTree(fragments, treeId) {
    // Use the new junction table for fragment-tree assignments
    for (let i = 0; i < fragments.length; i++) {
      const fragment = fragments[i];
      const nodeId = `node_${i + 1}`;
      
      const insertQuery = `
        INSERT INTO thinking_tools.fragment_tree_assignments 
        (fragment_id, tree_id, node_id, assignment_confidence, assignment_reason, assigned_by)
        VALUES ($1, $2, $3, $4, $5, 'claude-start-hook')
        ON CONFLICT (fragment_id, tree_id) 
        DO UPDATE SET
          node_id = EXCLUDED.node_id,
          assignment_confidence = EXCLUDED.assignment_confidence,
          assigned_at = NOW()
      `;
      
      await this.pool.query(insertQuery, [
        fragment.fragment_id,
        treeId,
        nodeId,
        fragment.confidence || 0.7,
        `Assigned based on pattern matching`
      ]);
    }
  }
}
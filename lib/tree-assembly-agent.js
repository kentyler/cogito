/**
 * Tree Assembly Agent - assembles fragments into coherent TOC structures
 */

import { v4 as uuidv4 } from 'uuid';

export class TreeAssemblyAgent {
  constructor(pool) {
    this.pool = pool;
    this.clientId = 6; // Claude Code client ID
  }

  async assembleTreesOnStartup(sessionId) {
    const debugLog = [];
    
    try {
      debugLog.push(`🌳 Tree Assembly Agent starting for session ${sessionId}`);
      
      // 1. Find unassigned fragments from recent sessions
      const unassignedFragments = await this.getUnassignedFragments();
      debugLog.push(`📦 Found ${unassignedFragments.length} unassigned fragments`);
      
      if (unassignedFragments.length === 0) {
        debugLog.push('✅ No fragments to assemble');
        return debugLog;
      }
      
      // 2. Group fragments by pattern similarity
      const fragmentGroups = this.groupFragmentsByPattern(unassignedFragments);
      debugLog.push(`🔍 Identified ${Object.keys(fragmentGroups).length} potential tree patterns`);
      
      // 3. For each group, determine if it forms a coherent tree
      for (const [pattern, fragments] of Object.entries(fragmentGroups)) {
        const treeType = this.determineTreeType(fragments);
        if (treeType) {
          debugLog.push(`🌲 Creating ${treeType} tree from ${fragments.length} fragments`);
          
          // 4. Create tree structure
          const tree = await this.createTree(sessionId, treeType, fragments);
          
          // 5. Assign fragments to tree
          await this.assignFragmentsToTree(fragments, tree.tree_id);
          
          debugLog.push(`✅ Created tree ${tree.tree_id} with ${fragments.length} fragments`);
        }
      }
      
      // 6. Check partially assigned fragments for additional tree membership
      const partiallyAssigned = await this.getPartiallyAssignedFragments();
      debugLog.push(`🔄 Checking ${partiallyAssigned.length} fragments for additional tree assignments`);
      
      for (const fragment of partiallyAssigned) {
        const additionalPatterns = this.detectPatterns(fragment);
        for (const pattern of additionalPatterns) {
          // Skip patterns already assigned
          if (!fragment.assigned_tree_types.includes(pattern)) {
            // Find or create a tree for this pattern
            const tree = await this.findOrCreateTreeForPattern(sessionId, pattern, [fragment]);
            if (tree) {
              await this.assignFragmentsToTree([fragment], tree.tree_id);
              debugLog.push(`➕ Added fragment "${fragment.label}" to ${pattern} tree`);
            }
          }
        }
      }
      
      // 7. Look for cross-tree relationships
      await this.identifyTreeRelationships();
      
    } catch (error) {
      debugLog.push(`❌ Error in tree assembly: ${error.message}`);
      console.error('Tree assembly error:', error);
    }
    
    return debugLog;
  }
  
  async getUnassignedFragments() {
    // Get fragments that haven't been assigned to ANY tree yet
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
  
  async getPartiallyAssignedFragments() {
    // Get fragments that might fit into additional trees
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
  
  groupFragmentsByPattern(fragments) {
    const groups = {};
    
    fragments.forEach(fragment => {
      // Group by TOC element patterns
      const patterns = this.detectPatterns(fragment);
      
      patterns.forEach(pattern => {
        if (!groups[pattern]) {
          groups[pattern] = [];
        }
        groups[pattern].push(fragment);
      });
    });
    
    return groups;
  }
  
  detectPatterns(fragment) {
    const patterns = [];
    
    // Evaporating Cloud pattern
    if (['want', 'need', 'conflict', 'assumption'].includes(fragment.toc_element_type)) {
      patterns.push('evaporating_cloud');
    }
    
    // Prerequisite Tree pattern
    if (['obstacle', 'injection', 'objective'].includes(fragment.toc_element_type)) {
      patterns.push('prerequisite_tree');
    }
    
    // Current Reality Tree pattern
    if (['undesirable_effect', 'root_cause', 'intermediate_effect'].includes(fragment.toc_element_type)) {
      patterns.push('current_reality_tree');
    }
    
    // Future Reality Tree pattern
    if (['desired_effect', 'solution', 'injection'].includes(fragment.toc_element_type)) {
      patterns.push('future_reality_tree');
    }
    
    return patterns;
  }
  
  determineTreeType(fragments) {
    // Count element types
    const typeCounts = {};
    fragments.forEach(f => {
      typeCounts[f.toc_element_type] = (typeCounts[f.toc_element_type] || 0) + 1;
    });
    
    // Evaporating Cloud: needs conflict + wants/needs
    if (typeCounts.conflict && (typeCounts.want || typeCounts.need)) {
      return 'evaporating_cloud';
    }
    
    // Prerequisite Tree: obstacles + objective
    if (typeCounts.obstacle && typeCounts.objective) {
      return 'prerequisite_tree';
    }
    
    // Current Reality Tree: undesirable effects
    if (typeCounts.undesirable_effect >= 2) {
      return 'current_reality_tree';
    }
    
    // Future Reality Tree: desired effects + solutions
    if (typeCounts.desired_effect || typeCounts.solution) {
      return 'future_reality_tree';
    }
    
    return null;
  }
  
  async createTree(sessionId, treeType, fragments) {
    // Build tree structure in ai-thinking-tools format
    const treeData = {
      diagramId: uuidv4(),
      diagramType: treeType,
      title: this.generateTreeTitle(treeType, fragments),
      nodes: {},
      links: []
    };
    
    // Convert fragments to nodes
    fragments.forEach((fragment, index) => {
      const nodeId = `node_${index + 1}`;
      treeData.nodes[nodeId] = {
        id: nodeId,
        label: fragment.label,
        type: fragment.toc_element_type,
        x: 100 + (index % 3) * 200,
        y: 100 + Math.floor(index / 3) * 150
      };
    });
    
    // Infer basic links based on element types
    treeData.links = this.inferLinks(treeData.nodes, treeType);
    
    // Insert tree into database
    const insertQuery = `
      INSERT INTO thinking_tools.trees 
      (client_id, session_id, diagram_id, tree_type, title, base_tree_data, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, 'claude-start-hook')
      RETURNING tree_id, title
    `;
    
    const result = await this.pool.query(insertQuery, [
      this.clientId,
      sessionId,
      treeData.diagramId,
      treeType,
      treeData.title,
      JSON.stringify(treeData)
    ]);
    
    return result.rows[0];
  }
  
  generateTreeTitle(treeType, fragments) {
    const titles = {
      evaporating_cloud: 'Conflict: ' + (fragments.find(f => f.toc_element_type === 'conflict')?.label || 'Resolution needed'),
      prerequisite_tree: 'Goal: ' + (fragments.find(f => f.toc_element_type === 'objective')?.label || 'Overcome obstacles'),
      current_reality_tree: 'Problem: ' + (fragments.find(f => f.toc_element_type === 'undesirable_effect')?.label || 'System issues'),
      future_reality_tree: 'Solution: ' + (fragments.find(f => f.toc_element_type === 'desired_effect')?.label || 'Desired state')
    };
    
    return titles[treeType] || `${treeType} - ${new Date().toLocaleDateString()}`;
  }
  
  inferLinks(nodes, treeType) {
    const links = [];
    const nodeArray = Object.values(nodes);
    
    // Simple heuristic linking based on tree type
    if (treeType === 'evaporating_cloud') {
      // Link wants/needs to conflict
      const conflict = nodeArray.find(n => n.type === 'conflict');
      const wants = nodeArray.filter(n => n.type === 'want');
      const needs = nodeArray.filter(n => n.type === 'need');
      
      if (conflict) {
        wants.forEach(want => {
          links.push({ from: want.id, to: conflict.id });
        });
        needs.forEach(need => {
          links.push({ from: need.id, to: conflict.id });
        });
      }
    }
    
    // Add more linking heuristics for other tree types as needed
    
    return links;
  }
  
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
        `Assigned to ${this.determineTreeType(fragments)} based on pattern matching`
      ]);
    }
  }
  
  async identifyTreeRelationships() {
    // Look for trees that might be related
    const recentTreesQuery = `
      SELECT tree_id, tree_type, title, base_tree_data
      FROM thinking_tools.trees
      WHERE client_id = $1
        AND created_at > NOW() - INTERVAL '7 days'
      ORDER BY created_at DESC
      LIMIT 10
    `;
    
    const result = await this.pool.query(recentTreesQuery, [this.clientId]);
    const trees = result.rows;
    
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
    
    // If no suitable tree exists and we have enough fragments, create a new one
    if (fragments.length >= 1) {
      return await this.createTree(sessionId, pattern, fragments);
    }
    
    return null;
  }
}
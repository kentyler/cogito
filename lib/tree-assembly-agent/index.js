/**
 * Tree Assembly Agent - Main orchestrator for assembling fragments into coherent TOC structures
 */

import { FragmentGrouper } from './fragment-grouper.js';
import { TreeCreator } from './tree-creator.js';
import { FragmentRetrieval } from './fragment-retrieval.js';
import { TreeRelationships } from './tree-relationships.js';

export class TreeAssemblyAgent {
  constructor(pool) {
    this.pool = pool;
    this.clientId = 6; // Claude Code client ID
    
    // Initialize components
    this.fragmentGrouper = new FragmentGrouper();
    this.treeCreator = new TreeCreator(pool, this.clientId);
    this.fragmentRetrieval = new FragmentRetrieval(pool, this.clientId);
    this.treeRelationships = new TreeRelationships(pool, this.clientId);
  }

  /**
   * Main entry point - assembles trees on startup
   */
  async assembleTreesOnStartup(sessionId) {
    const debugLog = [];
    
    try {
      debugLog.push(`🌳 Tree Assembly Agent starting for session ${sessionId}`);
      
      // 1. Find unassigned fragments from recent sessions
      const unassignedFragments = await this.fragmentRetrieval.getUnassignedFragments();
      debugLog.push(`📦 Found ${unassignedFragments.length} unassigned fragments`);
      
      if (unassignedFragments.length === 0) {
        debugLog.push('✅ No fragments to assemble');
        return debugLog;
      }
      
      // 2. Group fragments by pattern similarity
      const fragmentGroups = this.fragmentGrouper.groupFragmentsByPattern(unassignedFragments);
      debugLog.push(`🔍 Identified ${Object.keys(fragmentGroups).length} potential tree patterns`);
      
      // 3. For each group, determine if it forms a coherent tree
      for (const [pattern, fragments] of Object.entries(fragmentGroups)) {
        const treeType = this.fragmentGrouper.determineTreeType(fragments);
        if (treeType) {
          debugLog.push(`🌲 Creating ${treeType} tree from ${fragments.length} fragments`);
          
          // 4. Create tree structure
          const tree = await this.treeCreator.createTree(sessionId, treeType, fragments);
          
          // 5. Assign fragments to tree
          await this.treeRelationships.assignFragmentsToTree(fragments, tree.tree_id);
          
          debugLog.push(`✅ Created tree ${tree.tree_id} with ${fragments.length} fragments`);
        }
      }
      
      // 6. Check partially assigned fragments for additional tree membership
      const partiallyAssigned = await this.fragmentRetrieval.getPartiallyAssignedFragments();
      debugLog.push(`🔄 Checking ${partiallyAssigned.length} fragments for additional tree assignments`);
      
      for (const fragment of partiallyAssigned) {
        const additionalPatterns = this.fragmentGrouper.detectPatterns(fragment);
        for (const pattern of additionalPatterns) {
          // Skip patterns already assigned
          if (!fragment.assigned_tree_types.includes(pattern)) {
            // Find or create a tree for this pattern
            const existingTree = await this.fragmentRetrieval.findOrCreateTreeForPattern(sessionId, pattern, [fragment]);
            if (existingTree) {
              await this.treeRelationships.assignFragmentsToTree([fragment], existingTree.tree_id);
              debugLog.push(`➕ Added fragment "${fragment.label}" to ${pattern} tree`);
            } else if (pattern) {
              // Create new tree if needed
              const tree = await this.treeCreator.createTree(sessionId, pattern, [fragment]);
              if (tree) {
                await this.treeRelationships.assignFragmentsToTree([fragment], tree.tree_id);
                debugLog.push(`➕ Created new ${pattern} tree for fragment "${fragment.label}"`);
              }
            }
          }
        }
      }
      
      // 7. Look for cross-tree relationships
      const recentTrees = await this.fragmentRetrieval.getRecentTrees();
      await this.treeRelationships.identifyTreeRelationships(recentTrees);
      
    } catch (error) {
      debugLog.push(`❌ Error in tree assembly: ${error.message}`);
      console.error('Tree assembly error:', error);
    }
    
    return debugLog;
  }

  // Delegate methods for backward compatibility
  detectPatterns(fragment) {
    return this.fragmentGrouper.detectPatterns(fragment);
  }

  determineTreeType(fragments) {
    return this.fragmentGrouper.determineTreeType(fragments);
  }

  async createTree(sessionId, treeType, fragments) {
    return await this.treeCreator.createTree(sessionId, treeType, fragments);
  }

  async assignFragmentsToTree(fragments, treeId) {
    return await this.treeRelationships.assignFragmentsToTree(fragments, treeId);
  }
}
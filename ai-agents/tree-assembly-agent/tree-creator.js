/**
 * Tree Creator - Creates tree structures from grouped fragments
 */

import { v4 as uuidv4 } from 'uuid';
import { TitleGenerator } from './title-generator.js';
import { NodeCreator } from './node-creator.js';
import { LinkInferrer } from './link-inferrer.js';

export class TreeCreator {
  constructor(pool, clientId = 6) {
    this.pool = pool;
    this.clientId = clientId;
  }

  /**
   * Create a new tree structure from fragments
   */
  async createTree(sessionId, treeType, fragments) {
    const treeId = uuidv4();
    const title = TitleGenerator.generateTreeTitle(treeType, fragments);
    const nodes = NodeCreator.createNodesFromFragments(fragments);
    const links = LinkInferrer.inferLinks(nodes, treeType);
    
    // Build tree structure
    const tree = {
      tree_id: treeId,
      session_id: sessionId,
      tree_type: treeType,
      title: title,
      metadata: {
        created_at: new Date().toISOString(),
        fragment_count: fragments.length,
        auto_generated: true,
        client_id: this.clientId
      },
      structure: {
        nodes: nodes,
        links: links,
        layout: LinkInferrer.determineLayout(treeType)
      }
    };
    
    // Store in database
    await this.storeTree(tree);
    
    return tree;
  }

  /**
   * Store tree in database
   */
  async storeTree(tree) {
    const query = `
      INSERT INTO thinking_tools.trees (
        tree_id, session_id, tree_type, title, metadata, structure, client_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `;
    
    await this.pool.query(query, [
      tree.tree_id,
      tree.session_id,
      tree.tree_type,
      tree.title,
      JSON.stringify(tree.metadata),
      JSON.stringify(tree.structure),
      this.clientId
    ]);
  }
}
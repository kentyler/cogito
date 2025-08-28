/**
 * Link Inferrer - Infers links between nodes based on tree type
 */

export class LinkInferrer {
  /**
   * Infer links between nodes based on tree type
   */
  static inferLinks(nodes, treeType) {
    const links = [];
    
    switch (treeType) {
      case 'ordered_list':
      case 'decision_flow':
        // Sequential links
        for (let i = 0; i < nodes.length - 1; i++) {
          links.push({
            source: nodes[i].id,
            target: nodes[i + 1].id,
            type: 'sequence'
          });
        }
        break;
        
      case 'document_outline':
      case 'concept_hierarchy':
        // Hierarchical links (simplified - first node as root)
        if (nodes.length > 1) {
          const root = nodes[0];
          for (let i = 1; i < nodes.length; i++) {
            links.push({
              source: root.id,
              target: nodes[i].id,
              type: 'hierarchy'
            });
          }
        }
        break;
        
      case 'topic_cluster':
      case 'mixed_content':
        // Hub and spoke (first node as central hub)
        if (nodes.length > 2) {
          const hub = nodes[0];
          for (let i = 1; i < nodes.length; i++) {
            links.push({
              source: hub.id,
              target: nodes[i].id,
              type: 'association'
            });
          }
        }
        break;
        
      default:
        // Minimal linking for other types
        break;
    }
    
    return links;
  }

  /**
   * Determine layout style for tree type
   */
  static determineLayout(treeType) {
    const layouts = {
      'ordered_list': 'vertical_flow',
      'unordered_list': 'grid',
      'document_outline': 'tree',
      'faq_tree': 'accordion',
      'decision_flow': 'flowchart',
      'concept_hierarchy': 'radial',
      'topic_cluster': 'force_directed',
      'mixed_content': 'grid'
    };
    
    return layouts[treeType] || 'tree';
  }
}
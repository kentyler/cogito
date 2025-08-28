/**
 * Node Creator - Creates nodes from fragments
 */

export class NodeCreator {
  /**
   * Create nodes from fragments
   */
  static createNodesFromFragments(fragments) {
    return fragments.map((fragment, index) => ({
      id: fragment.fragment_id,
      text: fragment.content_text.substring(0, 200) + (fragment.content_text.length > 200 ? '...' : ''),
      full_text: fragment.content_text,
      order: index,
      metadata: {
        fragment_id: fragment.fragment_id,
        turn_id: fragment.turn_id,
        created_at: fragment.created_at
      }
    }));
  }
}
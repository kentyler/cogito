/**
 * ES module similarity orchestrator factory
 * Creates and configures similarity orchestrator instances
 */

import { SimilarityOrchestrator } from './lib/similarity-orchestrator.js';

export async function createSimilarityOrchestrator(pool, options = {}) {
  return new SimilarityOrchestrator(pool, options);
}
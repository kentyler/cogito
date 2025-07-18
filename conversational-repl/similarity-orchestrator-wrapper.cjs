/**
 * CommonJS wrapper for the ES module similarity orchestrator
 * This allows the conversational REPL server to use the similarity orchestrator
 */

module.exports = {
  async createSimilarityOrchestrator(pool, options = {}) {
    // Dynamic import of the ES module
    const { SimilarityOrchestrator } = await import('../lib/similarity-orchestrator.js');
    return new SimilarityOrchestrator(pool, options);
  }
};
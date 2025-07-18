/**
 * CommonJS wrapper for the ES module turn processor
 * This allows the conversational REPL server to use the turn processor
 */

module.exports = {
  async createTurnProcessor(pool, options = {}) {
    // Dynamic import of the ES module
    const { createTurnProcessor } = await import('../lib/turn-processor.js');
    return await createTurnProcessor(pool, options);
  }
};
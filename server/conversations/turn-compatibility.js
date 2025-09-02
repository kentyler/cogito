// Turn processing helpers that require proper middleware initialization

export function createTurn(req, turnData) {
  if (!req.turnProcessor) {
    throw new Error('Turn processor not available - req.turnProcessor is not initialized');
  }
  
  if (!req.turnProcessor.createTurn) {
    throw new Error('Turn processor missing createTurn method');
  }
  
  return req.turnProcessor.createTurn(turnData);
}


/**
 * Find similar turns using turn processor
 * @param {Object} options
 * @param {Object} options.req - Express request object with turn processor
 * @param {string} options.turnId - Turn ID to find similar turns for
 * @param {number} options.limit - Maximum number of similar turns to return
 * @param {number} options.threshold - Similarity threshold
 * @param {string|null} [options.parentClientId=null] - Parent client ID for mini-horde support
 * @returns {Array<Object>} Array of similar turns
 */
export function findSimilarTurns({ req, turnId, limit, threshold, parentClientId = null }) {
  if (!req.turnProcessor) {
    throw new Error('Turn processor not available - req.turnProcessor is not initialized');
  }
  
  if (!req.turnProcessor.findSimilarTurns) {
    throw new Error('Turn processor missing findSimilarTurns method');
  }
  
  return req.turnProcessor.findSimilarTurns(turnId, limit, threshold, parentClientId);
}
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


export function findSimilarTurns(req, turnId, limit, threshold, parentClientId = null) {
  if (!req.turnProcessor) {
    throw new Error('Turn processor not available - req.turnProcessor is not initialized');
  }
  
  if (!req.turnProcessor.findSimilarTurns) {
    throw new Error('Turn processor missing findSimilarTurns method');
  }
  
  return req.turnProcessor.findSimilarTurns(turnId, limit, threshold, parentClientId);
}
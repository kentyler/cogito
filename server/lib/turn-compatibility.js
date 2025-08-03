// Backward compatibility helpers for turn processing
// Handles both req.turnProcessor (new) and req.db (old deployment) APIs

export function createTurn(req, turnData) {
  if (req.turnProcessor && req.turnProcessor.createTurn) {
    return req.turnProcessor.createTurn(turnData);
  } else if (req.db && req.db.createTurn) {
    return req.db.createTurn(turnData);
  } else {
    throw new Error('Turn processor not available');
  }
}

export function findSimilarTurns(req, turnId, limit, threshold) {
  if (req.turnProcessor && req.turnProcessor.findSimilarTurns) {
    return req.turnProcessor.findSimilarTurns(turnId, limit, threshold);
  } else if (req.db && req.db.findSimilarTurns) {
    return req.db.findSimilarTurns(turnId, limit, threshold);
  } else {
    return [];
  }
}
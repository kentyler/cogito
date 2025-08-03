// Backward compatibility helpers for turn processing
// Handles both req.turnProcessor (new) and req.db (old deployment) APIs

export function createTurn(req, turnData) {
  // Log what's available for debugging
  console.log('createTurn - Available processors:', {
    hasTurnProcessor: !!req.turnProcessor,
    hasDb: !!req.db,
    hasPool: !!req.pool,
    turnProcessorKeys: req.turnProcessor ? Object.keys(req.turnProcessor) : [],
    dbKeys: req.db ? Object.keys(req.db) : []
  });
  
  if (req.turnProcessor && req.turnProcessor.createTurn) {
    return req.turnProcessor.createTurn(turnData);
  } else if (req.db && req.db.createTurn) {
    return req.db.createTurn(turnData);
  } else if (req.pool) {
    // Fallback: create turn directly with pool
    console.log('Using pool fallback for createTurn');
    return createTurnWithPool(req.pool, turnData);
  } else {
    throw new Error('Turn processor not available - no turnProcessor, db, or pool found');
  }
}

// Direct database implementation as fallback
async function createTurnWithPool(pool, turnData) {
  const {
    user_id,
    content,
    source_type,
    metadata = {},
    meeting_id = null,
    source_turn_id = null
  } = turnData;
  
  const result = await pool.query(`
    INSERT INTO meetings.turns 
    (user_id, content, source_type, source_turn_id, metadata, meeting_id, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, NOW())
    RETURNING turn_id, created_at, metadata
  `, [
    user_id,
    content,
    source_type,
    source_turn_id,
    metadata,
    meeting_id
  ]);
  
  return result.rows[0];
}

export function findSimilarTurns(req, turnId, limit, threshold) {
  if (req.turnProcessor && req.turnProcessor.findSimilarTurns) {
    return req.turnProcessor.findSimilarTurns(turnId, limit, threshold);
  } else if (req.db && req.db.findSimilarTurns) {
    return req.db.findSimilarTurns(turnId, limit, threshold);
  } else {
    // Return empty array if no similarity search available
    console.log('No similarity search available, returning empty array');
    return [];
  }
}
import express from 'express';
import { ApiResponses } from '#server/api/api-responses.js';

const router = express.Router();

// Semantic search endpoint
router.post('/search-turns', async (req, res) => {
  try {
    const { query, limit = 20, minSimilarity = 0.5 } = req.body;
    
    if (!query) {
      return ApiResponses.badRequest(res, 'Query is required');
    }
    
    const results = await req.turnProcessor.searchTurns(query, limit, minSimilarity);
    
    return ApiResponses.success(res, {
      query,
      results,
      count: results.length
    });
    
  } catch (error) {
    console.error('Search error:', error);
    return ApiResponses.internalError(res, 'Failed to search turns');
  }
});

// Find similar turns endpoint
router.get('/similar-turns/:turnId', async (req, res) => {
  try {
    const { turnId } = req.params;
    const { limit = 10, minSimilarity = 0.7 } = req.query;
    
    const results = await req.turnProcessor.findSimilarTurns(
      turnId, 
      parseInt(limit), 
      parseFloat(minSimilarity)
    );
    
    return ApiResponses.success(res, {
      source_turn_id: turnId,
      similar_turns: results,
      count: results.length
    });
    
  } catch (error) {
    console.error('Similar turns error:', error);
    return ApiResponses.internalError(res, 'Failed to find similar turns');
  }
});

export default router;
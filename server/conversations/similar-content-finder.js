/**
 * Similar Content Finder - Handles finding similar turns and chunks
 */

import { findSimilarTurns } from './turn-compatibility.js';
import { findSimilarChunks } from './conversation-context/chunk-finder.js';

export class SimilarContentFinder {
  /**
   * Find similar turns with error handling
   */
  static async findSimilarTurns(req, userTurnId, parentClientId) {
    try {
      const similarTurns = await findSimilarTurns(
        req,
        userTurnId, 
        10, // limit to 10 most similar turns
        0.7, // minimum similarity threshold
        parentClientId // include parent client data for mini-hordes
      );
      console.log('🔍 findSimilarTurns returned:', similarTurns?.length || 0, 'results');
      return similarTurns;
    } catch (error) {
      console.warn('Error finding similar turns:', error.message, error.stack);
      return [];
    }
  }

  /**
   * Find similar file chunks with error handling
   */
  static async findSimilarChunks(req, userTurn, clientId, parentClientId) {
    if (!this.canSearchChunks(req, clientId)) {
      console.log('🔍 Skipping chunk search - missing requirements:', {
        hasTurnProcessor: !!req.turnProcessor,
        hasEmbeddingService: !!(req.turnProcessor?.embeddingService),
        hasClientId: !!clientId
      });
      return [];
    }

    console.log('🔍 Looking for similar file chunks for client:', clientId);
    try {
      const similarChunks = await findSimilarChunks(
        req.pool, 
        req.turnProcessor.embeddingService, 
        userTurn.content, 
        clientId,
        5, // limit to 5 most similar chunks
        0.6, // minimum similarity threshold
        parentClientId // include parent client data for mini-hordes
      );
      console.log('🔍 findSimilarChunks returned:', similarChunks?.length || 0, 'results');
      return similarChunks;
    } catch (error) {
      console.warn('Error finding similar chunks:', error.message, error.stack);
      return [];
    }
  }

  /**
   * Check if chunk search is possible
   */
  static canSearchChunks(req, clientId) {
    return req.turnProcessor && 
           req.turnProcessor.embeddingService && 
           clientId;
  }
}
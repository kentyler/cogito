/**
 * Similarity Orchestrator - Coordinates turn collection and similarity analysis
 * Simple, focused on similarity/distance analysis rather than clustering
 */

import { TurnCollector } from './turn-collector.js';
import { SimilarityAnalyzer } from './similarity-analyzer.js';

export class SimilarityOrchestrator {
  constructor(pool, options = {}) {
    this.collector = new TurnCollector(pool);
    this.analyzer = new SimilarityAnalyzer(options.analyzer || {});
  }

  /**
   * Analyze similarity patterns in a single block
   * @param {string} blockId - Block ID to analyze
   * @param {Object} options - Analysis options
   * @returns {Object} - Complete similarity analysis
   */
  async analyzeBlock(blockId, options = {}) {
    const collectionOptions = {
      includeEmbeddings: true,
      minContentLength: options.minContentLength || 10,
      sourceTypes: options.sourceTypes,
      timeRange: options.timeRange
    };

    // Collect turns from block
    const turns = await this.collector.collectFromBlock(blockId, collectionOptions);
    
    if (turns.length === 0) {
      return {
        block_id: blockId,
        analysis: this.analyzer.createEmptyAnalysis(),
        stats: {
          total_turns: 0,
          turns_analyzed: 0,
          collection_time: new Date()
        }
      };
    }

    // Analyze similarities
    const analysis = await this.analyzer.analyzeTurns(turns);
    
    // Get collection stats
    const stats = await this.collector.getCollectionStats(blockId);
    
    return {
      block_id: blockId,
      analysis: analysis,
      stats: {
        ...stats,
        turns_analyzed: analysis.total_turns,
        collection_time: new Date()
      }
    };
  }

  /**
   * Analyze similarity patterns across multiple blocks
   * @param {Array} blockIds - Array of block IDs
   * @param {Object} options - Analysis options
   * @returns {Object} - Cross-block similarity analysis
   */
  async analyzeBlocks(blockIds, options = {}) {
    const collectionOptions = {
      includeEmbeddings: true,
      minContentLength: options.minContentLength || 10,
      sourceTypes: options.sourceTypes,
      timeRange: options.timeRange,
      maxTurnsPerBlock: options.maxTurnsPerBlock
    };

    // Collect turns from all blocks
    const turns = await this.collector.collectFromBlocks(blockIds, collectionOptions);
    
    if (turns.length === 0) {
      return {
        block_ids: blockIds,
        analysis: this.analyzer.createEmptyAnalysis(),
        stats: {
          total_turns: 0,
          turns_analyzed: 0,
          blocks_analyzed: blockIds.length,
          collection_time: new Date()
        }
      };
    }

    // Analyze similarities
    const analysis = await this.analyzer.analyzeTurns(turns);
    
    return {
      block_ids: blockIds,
      analysis: analysis,
      stats: {
        total_turns: turns.length,
        turns_analyzed: analysis.total_turns,
        blocks_analyzed: blockIds.length,
        collection_time: new Date()
      }
    };
  }

  /**
   * Analyze similarity patterns in a conversation thread
   * @param {string} rootTurnId - Starting turn ID
   * @param {Object} options - Analysis options
   * @returns {Object} - Thread similarity analysis
   */
  async analyzeThread(rootTurnId, options = {}) {
    const collectionOptions = {
      includeEmbeddings: true,
      maxDepth: options.maxDepth || 10
    };

    // Collect turns from thread
    const turns = await this.collector.collectThread(rootTurnId, collectionOptions);
    
    if (turns.length === 0) {
      return {
        root_turn_id: rootTurnId,
        analysis: this.analyzer.createEmptyAnalysis(),
        stats: {
          total_turns: 0,
          turns_analyzed: 0,
          thread_depth: 0,
          collection_time: new Date()
        }
      };
    }

    // Analyze similarities
    const analysis = await this.analyzer.analyzeTurns(turns);
    
    return {
      root_turn_id: rootTurnId,
      analysis: analysis,
      stats: {
        total_turns: turns.length,
        turns_analyzed: analysis.total_turns,
        thread_depth: Math.max(...turns.map(t => t.depth || 0)),
        collection_time: new Date()
      }
    };
  }

  /**
   * Get similarity insights for a specific turn
   * @param {string} turnId - Turn ID to analyze
   * @param {Object} options - Analysis options
   * @returns {Object} - Turn-specific similarity insights
   */
  async analyzeTurnSimilarities(turnId, options = {}) {
    const { contextSize = 50, minSimilarity = 0.5 } = options;

    // Get the target turn
    const targetTurnQuery = `
      SELECT 
        t.turn_id,
        t.content,
        t.timestamp,
        t.source_type,
        t.metadata,
        t.content_embedding,
        bt.block_id
      FROM conversation.turns t
      JOIN conversation.block_turns bt ON t.turn_id = bt.turn_id
      WHERE t.turn_id = $1
      AND t.content_embedding IS NOT NULL
    `;

    const targetResult = await this.collector.pool.query(targetTurnQuery, [turnId]);
    if (targetResult.rows.length === 0) {
      return { error: 'Turn not found or has no embedding' };
    }

    const targetTurn = this.collector.processRows(targetResult.rows)[0];

    // Get context turns from the same block
    const contextTurns = await this.collector.collectFromBlock(
      targetTurn.block_id,
      { includeEmbeddings: true, minContentLength: 5 }
    );

    // Calculate similarities to all context turns
    const similarities = contextTurns
      .filter(turn => turn.turn_id !== turnId)
      .map(turn => ({
        turn: turn,
        similarity: this.analyzer.cosineSimilarity(
          targetTurn.content_embedding,
          turn.content_embedding
        )
      }))
      .filter(item => item.similarity >= minSimilarity)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, contextSize);

    return {
      target_turn: {
        turn_id: targetTurn.turn_id,
        content: targetTurn.content,
        timestamp: targetTurn.timestamp,
        source_type: targetTurn.source_type
      },
      similar_turns: similarities.map(item => ({
        turn_id: item.turn.turn_id,
        similarity: item.similarity,
        content_preview: item.turn.content.substring(0, 150),
        timestamp: item.turn.timestamp,
        source_type: item.turn.source_type,
        time_distance_minutes: Math.abs(
          new Date(targetTurn.timestamp) - new Date(item.turn.timestamp)
        ) / 1000 / 60
      })),
      analysis_stats: {
        total_context_turns: contextTurns.length,
        similar_turns_found: similarities.length,
        avg_similarity: similarities.reduce((sum, item) => sum + item.similarity, 0) / similarities.length,
        analysis_time: new Date()
      }
    };
  }

  /**
   * Compare similarity patterns between two blocks
   * @param {string} blockId1 - First block ID
   * @param {string} blockId2 - Second block ID
   * @param {Object} options - Comparison options
   * @returns {Object} - Block comparison
   */
  async compareBlocks(blockId1, blockId2, options = {}) {
    const analysis1 = await this.analyzeBlock(blockId1, options);
    const analysis2 = await this.analyzeBlock(blockId2, options);

    const comparison = this.compareAnalyses(analysis1.analysis, analysis2.analysis);

    return {
      block_1: analysis1,
      block_2: analysis2,
      comparison: comparison
    };
  }

  /**
   * Compare two similarity analyses
   * @param {Object} analysis1 - First analysis
   * @param {Object} analysis2 - Second analysis
   * @returns {Object} - Comparison metrics
   */
  compareAnalyses(analysis1, analysis2) {
    const coherence1 = analysis1.insights.coherence.score;
    const coherence2 = analysis2.insights.coherence.score;
    
    const flow1 = analysis1.flow_analysis.overall_flow;
    const flow2 = analysis2.flow_analysis.overall_flow;

    return {
      coherence_difference: coherence1 - coherence2,
      flow_stability_comparison: {
        block_1: flow1.flow_stability,
        block_2: flow2.flow_stability,
        similarity_difference: flow1.avg_similarity - flow2.avg_similarity
      },
      topic_shift_comparison: {
        block_1_shifts: flow1.major_shifts,
        block_2_shifts: flow2.major_shifts,
        difference: flow1.major_shifts - flow2.major_shifts
      },
      conversation_style: {
        block_1: this.classifyConversationStyle(analysis1),
        block_2: this.classifyConversationStyle(analysis2)
      }
    };
  }

  /**
   * Classify conversation style based on similarity patterns
   * @param {Object} analysis - Similarity analysis
   * @returns {string} - Conversation style classification
   */
  classifyConversationStyle(analysis) {
    const coherence = analysis.insights.coherence.score;
    const majorShifts = analysis.flow_analysis.overall_flow.major_shifts;
    const totalTurns = analysis.total_turns;
    
    const shiftRate = totalTurns > 0 ? majorShifts / totalTurns : 0;

    if (coherence > 0.7 && shiftRate < 0.1) return 'focused';
    if (coherence > 0.5 && shiftRate < 0.2) return 'structured';
    if (coherence > 0.3 && shiftRate < 0.3) return 'exploratory';
    return 'dynamic';
  }

  /**
   * Get summary statistics for similarity analysis
   * @param {string} blockId - Block ID
   * @returns {Object} - Summary statistics
   */
  async getSummaryStats(blockId) {
    const analysis = await this.analyzeBlock(blockId);
    const insights = analysis.analysis.insights;
    const flow = analysis.analysis.flow_analysis.overall_flow;

    return {
      block_id: blockId,
      conversation_style: this.classifyConversationStyle(analysis.analysis),
      coherence_level: insights.coherence.level,
      flow_stability: flow.flow_stability,
      key_insights: {
        central_turns: insights.central_turns.length,
        outlier_turns: insights.outlier_turns.length,
        bridge_turns: insights.bridge_turns.length,
        callback_turns: insights.callback_turns.length,
        topic_shifts: insights.topic_shifts.length
      },
      flow_metrics: {
        avg_similarity: flow.avg_similarity,
        major_shifts: flow.major_shifts,
        continuous_percentage: flow.continuous_percentage
      }
    };
  }

  /**
   * Get available blocks for analysis
   * @returns {Array} - Array of block info with basic stats
   */
  async getAvailableBlocks() {
    const blockIds = await this.collector.getAllBlockIds();
    const blocks = [];
    
    for (const blockId of blockIds) {
      const stats = await this.collector.getCollectionStats(blockId);
      blocks.push({
        block_id: blockId,
        ...stats,
        has_sufficient_data: stats.turns_with_embeddings >= 5
      });
    }
    
    return blocks
      .filter(block => block.has_sufficient_data)
      .sort((a, b) => new Date(b.latest_turn) - new Date(a.latest_turn));
  }
}
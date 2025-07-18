/**
 * Attractor Orchestrator - Coordinates collection and analysis
 * Brings together TurnCollector and AttractorAnalyzer
 */

import { TurnCollector } from './turn-collector.js';
import { AttractorAnalyzer } from './attractor-analyzer.js';

export class AttractorOrchestrator {
  constructor(pool, options = {}) {
    this.collector = new TurnCollector(pool);
    this.analyzer = new AttractorAnalyzer(options.analyzer || {});
  }

  /**
   * Analyze attractors in a single block
   * @param {string} blockId - Block ID to analyze
   * @param {Object} options - Analysis options
   * @returns {Object} - Complete analysis result
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
        attractors: [],
        topology: { type: 'empty', energy: 0 },
        stats: {
          total_turns: 0,
          turns_analyzed: 0,
          collection_time: new Date()
        }
      };
    }

    // Find attractors
    const attractors = await this.analyzer.findAttractors(turns);
    
    // Analyze topology
    const topology = this.analyzer.analyzeTopology(attractors);
    
    // Get collection stats
    const stats = await this.collector.getCollectionStats(blockId);
    
    return {
      block_id: blockId,
      attractors: attractors,
      topology: topology,
      stats: {
        ...stats,
        turns_analyzed: turns.length,
        attractor_count: attractors.length,
        collection_time: new Date()
      }
    };
  }

  /**
   * Analyze attractors across multiple blocks
   * @param {Array} blockIds - Array of block IDs
   * @param {Object} options - Analysis options
   * @returns {Object} - Cross-block analysis result
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
        attractors: [],
        topology: { type: 'empty', energy: 0 },
        stats: {
          total_turns: 0,
          turns_analyzed: 0,
          blocks_analyzed: blockIds.length,
          collection_time: new Date()
        }
      };
    }

    // Find attractors
    const attractors = await this.analyzer.findAttractors(turns);
    
    // Analyze topology
    const topology = this.analyzer.analyzeTopology(attractors);
    
    return {
      block_ids: blockIds,
      attractors: attractors,
      topology: topology,
      stats: {
        total_turns: turns.length,
        turns_analyzed: turns.length,
        blocks_analyzed: blockIds.length,
        attractor_count: attractors.length,
        collection_time: new Date()
      }
    };
  }

  /**
   * Analyze attractors in a conversation thread
   * @param {string} rootTurnId - Starting turn ID
   * @param {Object} options - Analysis options
   * @returns {Object} - Thread analysis result
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
        attractors: [],
        topology: { type: 'empty', energy: 0 },
        stats: {
          total_turns: 0,
          turns_analyzed: 0,
          thread_depth: 0,
          collection_time: new Date()
        }
      };
    }

    // Find attractors
    const attractors = await this.analyzer.findAttractors(turns);
    
    // Analyze topology
    const topology = this.analyzer.analyzeTopology(attractors);
    
    return {
      root_turn_id: rootTurnId,
      attractors: attractors,
      topology: topology,
      stats: {
        total_turns: turns.length,
        turns_analyzed: turns.length,
        thread_depth: Math.max(...turns.map(t => t.depth || 0)),
        attractor_count: attractors.length,
        collection_time: new Date()
      }
    };
  }

  /**
   * Compare attractors between two blocks
   * @param {string} blockId1 - First block ID
   * @param {string} blockId2 - Second block ID
   * @param {Object} options - Comparison options
   * @returns {Object} - Comparison result
   */
  async compareBlocks(blockId1, blockId2, options = {}) {
    const analysis1 = await this.analyzeBlock(blockId1, options);
    const analysis2 = await this.analyzeBlock(blockId2, options);

    const comparison = this.compareAnalyses(analysis1, analysis2);

    return {
      block_1: analysis1,
      block_2: analysis2,
      comparison: comparison
    };
  }

  /**
   * Compare two analysis results
   * @param {Object} analysis1 - First analysis
   * @param {Object} analysis2 - Second analysis
   * @returns {Object} - Comparison metrics
   */
  compareAnalyses(analysis1, analysis2) {
    return {
      topology_similarity: this.compareTopologies(analysis1.topology, analysis2.topology),
      attractor_count_diff: analysis1.attractors.length - analysis2.attractors.length,
      energy_diff: analysis1.topology.energy - analysis2.topology.energy,
      shared_themes: this.findSharedThemes(analysis1.attractors, analysis2.attractors),
      temporal_comparison: this.compareTemporalPatterns(analysis1.attractors, analysis2.attractors)
    };
  }

  /**
   * Compare topology types
   * @param {Object} topology1 - First topology
   * @param {Object} topology2 - Second topology
   * @returns {number} - Similarity score (0-1)
   */
  compareTopologies(topology1, topology2) {
    if (topology1.type === topology2.type) {
      return 1 - Math.abs(topology1.energy - topology2.energy);
    }
    return 0.5; // Different types but some similarity
  }

  /**
   * Find shared themes between attractor sets
   * @param {Array} attractors1 - First set of attractors
   * @param {Array} attractors2 - Second set of attractors
   * @returns {Array} - Array of shared theme info
   */
  findSharedThemes(attractors1, attractors2) {
    const sharedThemes = [];
    
    for (const attr1 of attractors1) {
      for (const attr2 of attractors2) {
        const similarity = this.analyzer.cosineSimilarity(
          attr1.centroid_embedding,
          attr2.centroid_embedding
        );
        
        if (similarity > 0.8) {
          sharedThemes.push({
            similarity: similarity,
            theme1: attr1.representative_content,
            theme2: attr2.representative_content
          });
        }
      }
    }
    
    return sharedThemes.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Compare temporal patterns
   * @param {Array} attractors1 - First set of attractors
   * @param {Array} attractors2 - Second set of attractors
   * @returns {Object} - Temporal comparison
   */
  compareTemporalPatterns(attractors1, attractors2) {
    const getDensity = (attractors) => {
      if (attractors.length === 0) return 0;
      return attractors.reduce((sum, a) => sum + (a.timespan?.temporal_density || 0), 0) / attractors.length;
    };

    const getDuration = (attractors) => {
      if (attractors.length === 0) return 0;
      return attractors.reduce((sum, a) => sum + (a.timespan?.duration_ms || 0), 0) / attractors.length;
    };

    return {
      density_diff: getDensity(attractors1) - getDensity(attractors2),
      duration_diff: getDuration(attractors1) - getDuration(attractors2),
      pattern_similarity: this.calculatePatternSimilarity(attractors1, attractors2)
    };
  }

  /**
   * Calculate pattern similarity between attractor sets
   * @param {Array} attractors1 - First set
   * @param {Array} attractors2 - Second set
   * @returns {number} - Pattern similarity (0-1)
   */
  calculatePatternSimilarity(attractors1, attractors2) {
    // Simple heuristic based on structure similarity
    const struct1 = {
      count: attractors1.length,
      avgStrength: attractors1.reduce((sum, a) => sum + a.strength, 0) / Math.max(1, attractors1.length),
      hasMultiSource: attractors1.some(a => a.source_diversity?.is_mixed)
    };

    const struct2 = {
      count: attractors2.length,
      avgStrength: attractors2.reduce((sum, a) => sum + a.strength, 0) / Math.max(1, attractors2.length),
      hasMultiSource: attractors2.some(a => a.source_diversity?.is_mixed)
    };

    let similarity = 0;
    
    // Count similarity (normalized)
    similarity += 1 - Math.abs(struct1.count - struct2.count) / Math.max(struct1.count, struct2.count, 1);
    
    // Strength similarity
    similarity += 1 - Math.abs(struct1.avgStrength - struct2.avgStrength);
    
    // Source diversity similarity
    similarity += struct1.hasMultiSource === struct2.hasMultiSource ? 1 : 0;
    
    return similarity / 3;
  }

  /**
   * Get available blocks for analysis
   * @returns {Array} - Array of block info
   */
  async getAvailableBlocks() {
    const blockIds = await this.collector.getAllBlockIds();
    const blocks = [];
    
    for (const blockId of blockIds) {
      const stats = await this.collector.getCollectionStats(blockId);
      blocks.push({
        block_id: blockId,
        ...stats
      });
    }
    
    return blocks.sort((a, b) => new Date(b.latest_turn) - new Date(a.latest_turn));
  }
}
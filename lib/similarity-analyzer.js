/**
 * Similarity Analyzer - Focus on distance/similarity calculations
 * Simple, interpretable analysis without complex clustering
 */

export class SimilarityAnalyzer {
  constructor(options = {}) {
    this.dimensions = options.dimensions || 1536;
    this.similarityThreshold = options.similarityThreshold || 0.7;
  }

  /**
   * Analyze similarities within a set of turns
   * @param {Array} turns - Array of turn objects with content_embedding
   * @returns {Object} - Similarity analysis results
   */
  async analyzeTurns(turns) {
    if (!turns || turns.length === 0) {
      return this.createEmptyAnalysis();
    }

    // Filter turns that have embeddings
    const validTurns = turns.filter(turn => 
      turn.content_embedding && Array.isArray(turn.content_embedding)
    );

    if (validTurns.length === 0) {
      return this.createEmptyAnalysis();
    }

    // Calculate similarity matrix
    const similarityMatrix = this.calculateSimilarityMatrix(validTurns);
    
    // Analyze each turn
    const turnAnalyses = validTurns.map((turn, index) => 
      this.analyzeTurn(turn, index, validTurns, similarityMatrix)
    );

    // Analyze conversation flow
    const flowAnalysis = this.analyzeConversationFlow(validTurns, similarityMatrix);

    // Find conversation insights
    const insights = this.findConversationInsights(validTurns, turnAnalyses, similarityMatrix);

    return {
      total_turns: validTurns.length,
      turn_analyses: turnAnalyses,
      flow_analysis: flowAnalysis,
      insights: insights,
      similarity_matrix: similarityMatrix, // Optional: include for debugging
      analysis_time: new Date()
    };
  }

  /**
   * Calculate similarity matrix for all turns
   * @param {Array} turns - Array of turns with embeddings
   * @returns {Array} - 2D similarity matrix
   */
  calculateSimilarityMatrix(turns) {
    const matrix = [];
    
    for (let i = 0; i < turns.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < turns.length; j++) {
        if (i === j) {
          matrix[i][j] = 1.0;
        } else {
          matrix[i][j] = this.cosineSimilarity(
            turns[i].content_embedding,
            turns[j].content_embedding
          );
        }
      }
    }
    
    return matrix;
  }

  /**
   * Analyze a single turn's relationships
   * @param {Object} turn - Turn object
   * @param {number} index - Turn index in array
   * @param {Array} allTurns - All turns
   * @param {Array} similarityMatrix - Precomputed similarity matrix
   * @returns {Object} - Turn analysis
   */
  analyzeTurn(turn, index, allTurns, similarityMatrix) {
    const similarities = similarityMatrix[index];
    
    // Find most similar turns (excluding self)
    const otherSimilarities = similarities
      .map((sim, i) => ({ similarity: sim, index: i, turn: allTurns[i] }))
      .filter((item, i) => i !== index)
      .sort((a, b) => b.similarity - a.similarity);

    const mostSimilar = otherSimilarities.slice(0, 5);
    const leastSimilar = otherSimilarities.slice(-3);

    // Calculate average similarity to all other turns
    const avgSimilarity = otherSimilarities.reduce((sum, item) => sum + item.similarity, 0) / otherSimilarities.length;

    // Find highly similar turns (above threshold)
    const highlySimilar = otherSimilarities.filter(item => item.similarity >= this.similarityThreshold);

    // Calculate position-based similarities
    const positionAnalysis = this.analyzePositionalSimilarity(turn, index, allTurns, similarities);

    return {
      turn_id: turn.turn_id,
      content_preview: turn.content.substring(0, 100),
      timestamp: turn.timestamp,
      source_type: turn.source_type,
      
      // Similarity metrics
      avg_similarity: avgSimilarity,
      max_similarity: mostSimilar.length > 0 ? mostSimilar[0].similarity : 0,
      min_similarity: leastSimilar.length > 0 ? leastSimilar[leastSimilar.length - 1].similarity : 0,
      
      // Related turns
      most_similar: mostSimilar.map(item => ({
        turn_id: item.turn.turn_id,
        similarity: item.similarity,
        content_preview: item.turn.content.substring(0, 100),
        timestamp: item.turn.timestamp,
        time_distance: Math.abs(new Date(turn.timestamp) - new Date(item.turn.timestamp)) / 1000 / 60 // minutes
      })),
      
      highly_similar_count: highlySimilar.length,
      
      // Position analysis
      position_analysis: positionAnalysis,
      
      // Turn characteristics
      is_outlier: avgSimilarity < 0.3,
      is_central: avgSimilarity > 0.6,
      is_bridge: this.isBridgeTurn(index, similarities, allTurns),
      
      // Temporal patterns
      temporal_patterns: this.analyzeTemporalPatterns(turn, index, allTurns, similarities)
    };
  }

  /**
   * Analyze positional similarity patterns
   * @param {Object} turn - Current turn
   * @param {number} index - Turn index
   * @param {Array} allTurns - All turns
   * @param {Array} similarities - Similarity array for this turn
   * @returns {Object} - Position analysis
   */
  analyzePositionalSimilarity(turn, index, allTurns, similarities) {
    const windowSize = 5;
    
    // Similarity to immediately adjacent turns
    const adjacentSimilarity = {
      to_previous: index > 0 ? similarities[index - 1] : null,
      to_next: index < allTurns.length - 1 ? similarities[index + 1] : null
    };

    // Similarity to nearby turns (within window)
    const nearbyIndices = [];
    for (let i = Math.max(0, index - windowSize); i <= Math.min(allTurns.length - 1, index + windowSize); i++) {
      if (i !== index) nearbyIndices.push(i);
    }
    
    const nearbySimilarity = nearbyIndices.length > 0 
      ? nearbyIndices.reduce((sum, i) => sum + similarities[i], 0) / nearbyIndices.length
      : 0;

    // Similarity to conversation start/end
    const startSimilarity = similarities[0];
    const endSimilarity = similarities[similarities.length - 1];

    return {
      adjacent: adjacentSimilarity,
      nearby_average: nearbySimilarity,
      to_start: startSimilarity,
      to_end: endSimilarity,
      position_in_conversation: index / (allTurns.length - 1), // 0 to 1
      is_topic_shift: adjacentSimilarity.to_previous !== null && adjacentSimilarity.to_previous < 0.4,
      is_callback: this.isCallbackTurn(index, similarities, allTurns)
    };
  }

  /**
   * Analyze conversation flow patterns
   * @param {Array} turns - Array of turns
   * @param {Array} similarityMatrix - Similarity matrix
   * @returns {Object} - Flow analysis
   */
  analyzeConversationFlow(turns, similarityMatrix) {
    const flowMetrics = [];
    
    // Calculate flow metrics for each turn
    for (let i = 1; i < turns.length; i++) {
      const prevTurnSimilarity = similarityMatrix[i][i - 1];
      const avgSimilarityToPrevious = i > 5 
        ? Array.from({ length: Math.min(5, i) }, (_, j) => similarityMatrix[i][i - 1 - j])
            .reduce((sum, sim) => sum + sim, 0) / Math.min(5, i)
        : prevTurnSimilarity;

      flowMetrics.push({
        turn_index: i,
        turn_id: turns[i].turn_id,
        timestamp: turns[i].timestamp,
        similarity_to_previous: prevTurnSimilarity,
        avg_similarity_to_recent: avgSimilarityToPrevious,
        flow_continuity: prevTurnSimilarity > 0.5 ? 'continuous' : 'shift',
        is_major_shift: prevTurnSimilarity < 0.3
      });
    }

    // Identify conversation phases
    const phases = this.identifyConversationPhases(flowMetrics);

    // Calculate overall flow statistics
    const avgFlowSimilarity = flowMetrics.reduce((sum, metric) => sum + metric.similarity_to_previous, 0) / flowMetrics.length;
    const majorShifts = flowMetrics.filter(metric => metric.is_major_shift);
    const continuousSegments = flowMetrics.filter(metric => metric.flow_continuity === 'continuous');

    return {
      flow_metrics: flowMetrics,
      phases: phases,
      overall_flow: {
        avg_similarity: avgFlowSimilarity,
        major_shifts: majorShifts.length,
        continuous_percentage: (continuousSegments.length / flowMetrics.length) * 100,
        flow_stability: avgFlowSimilarity > 0.5 ? 'stable' : 'dynamic'
      }
    };
  }

  /**
   * Find conversation insights
   * @param {Array} turns - Array of turns
   * @param {Array} turnAnalyses - Individual turn analyses
   * @param {Array} similarityMatrix - Similarity matrix
   * @returns {Object} - Conversation insights
   */
  findConversationInsights(turns, turnAnalyses, similarityMatrix) {
    // Find central turns (high average similarity)
    const centralTurns = turnAnalyses
      .filter(analysis => analysis.is_central)
      .sort((a, b) => b.avg_similarity - a.avg_similarity)
      .slice(0, 3);

    // Find outlier turns (low average similarity)
    const outlierTurns = turnAnalyses
      .filter(analysis => analysis.is_outlier)
      .sort((a, b) => a.avg_similarity - b.avg_similarity)
      .slice(0, 3);

    // Find bridge turns (connect distant parts)
    const bridgeTurns = turnAnalyses
      .filter(analysis => analysis.is_bridge)
      .slice(0, 3);

    // Find callback moments (similar to much earlier turns)
    const callbackTurns = turnAnalyses
      .filter(analysis => analysis.position_analysis.is_callback)
      .slice(0, 3);

    // Calculate conversation coherence
    const avgSimilarity = turnAnalyses.reduce((sum, analysis) => sum + analysis.avg_similarity, 0) / turnAnalyses.length;
    const coherenceScore = avgSimilarity;

    // Find topic shifts
    const topicShifts = turnAnalyses
      .filter(analysis => analysis.position_analysis.is_topic_shift)
      .map(analysis => ({
        turn_id: analysis.turn_id,
        timestamp: analysis.timestamp,
        content_preview: analysis.content_preview,
        similarity_to_previous: analysis.position_analysis.adjacent.to_previous
      }));

    return {
      central_turns: centralTurns.map(t => ({
        turn_id: t.turn_id,
        content_preview: t.content_preview,
        avg_similarity: t.avg_similarity,
        timestamp: t.timestamp
      })),
      
      outlier_turns: outlierTurns.map(t => ({
        turn_id: t.turn_id,
        content_preview: t.content_preview,
        avg_similarity: t.avg_similarity,
        timestamp: t.timestamp
      })),
      
      bridge_turns: bridgeTurns.map(t => ({
        turn_id: t.turn_id,
        content_preview: t.content_preview,
        timestamp: t.timestamp
      })),
      
      callback_turns: callbackTurns.map(t => ({
        turn_id: t.turn_id,
        content_preview: t.content_preview,
        timestamp: t.timestamp
      })),
      
      topic_shifts: topicShifts,
      
      coherence: {
        score: coherenceScore,
        level: coherenceScore > 0.6 ? 'high' : coherenceScore > 0.4 ? 'medium' : 'low',
        interpretation: this.interpretCoherence(coherenceScore)
      }
    };
  }

  /**
   * Check if a turn is a bridge between distant topics
   * @param {number} index - Turn index
   * @param {Array} similarities - Similarity array for this turn
   * @param {Array} allTurns - All turns
   * @returns {boolean} - Whether turn is a bridge
   */
  isBridgeTurn(index, similarities, allTurns) {
    const windowSize = 10;
    const threshold = 0.6;
    
    // Check if turn has high similarity to turns both before and after a gap
    let beforeGroup = 0;
    let afterGroup = 0;
    
    // Count high similarities in early part of conversation
    for (let i = 0; i < Math.min(windowSize, index); i++) {
      if (similarities[i] > threshold) beforeGroup++;
    }
    
    // Count high similarities in later part of conversation
    for (let i = Math.max(index + 1, allTurns.length - windowSize); i < allTurns.length; i++) {
      if (similarities[i] > threshold) afterGroup++;
    }
    
    return beforeGroup > 0 && afterGroup > 0;
  }

  /**
   * Check if a turn is a callback to earlier topics
   * @param {number} index - Turn index
   * @param {Array} similarities - Similarity array for this turn
   * @param {Array} allTurns - All turns
   * @returns {boolean} - Whether turn is a callback
   */
  isCallbackTurn(index, similarities, allTurns) {
    const minDistance = 10; // Minimum distance to be considered a callback
    const threshold = 0.7;
    
    if (index < minDistance) return false;
    
    // Check if there's high similarity to turns much earlier
    for (let i = 0; i < index - minDistance; i++) {
      if (similarities[i] > threshold) return true;
    }
    
    return false;
  }

  /**
   * Analyze temporal patterns for a turn
   * @param {Object} turn - Current turn
   * @param {number} index - Turn index
   * @param {Array} allTurns - All turns
   * @param {Array} similarities - Similarity array
   * @returns {Object} - Temporal analysis
   */
  analyzeTemporalPatterns(turn, index, allTurns, similarities) {
    const timeSimilarities = similarities.map((sim, i) => ({
      similarity: sim,
      time_distance: Math.abs(new Date(turn.timestamp) - new Date(allTurns[i].timestamp)) / 1000 / 60 // minutes
    })).filter((item, i) => i !== index);

    // Find patterns in time vs similarity
    const recentSimilar = timeSimilarities.filter(item => item.time_distance < 5 && item.similarity > 0.6);
    const distantSimilar = timeSimilarities.filter(item => item.time_distance > 30 && item.similarity > 0.6);

    return {
      recent_similar_count: recentSimilar.length,
      distant_similar_count: distantSimilar.length,
      has_recent_echoes: recentSimilar.length > 0,
      has_distant_echoes: distantSimilar.length > 0,
      temporal_pattern: this.classifyTemporalPattern(recentSimilar.length, distantSimilar.length)
    };
  }

  /**
   * Classify temporal pattern
   * @param {number} recentCount - Count of recent similar turns
   * @param {number} distantCount - Count of distant similar turns
   * @returns {string} - Pattern classification
   */
  classifyTemporalPattern(recentCount, distantCount) {
    if (recentCount > 0 && distantCount > 0) return 'bridging';
    if (recentCount > 0) return 'continuation';
    if (distantCount > 0) return 'callback';
    return 'novel';
  }

  /**
   * Identify conversation phases
   * @param {Array} flowMetrics - Flow metrics
   * @returns {Array} - Conversation phases
   */
  identifyConversationPhases(flowMetrics) {
    const phases = [];
    let currentPhase = {
      start_index: 0,
      start_time: flowMetrics[0]?.timestamp,
      turns: []
    };

    for (let i = 0; i < flowMetrics.length; i++) {
      const metric = flowMetrics[i];
      
      if (metric.is_major_shift && currentPhase.turns.length > 0) {
        // End current phase
        currentPhase.end_index = i - 1;
        currentPhase.end_time = flowMetrics[i - 1].timestamp;
        currentPhase.duration_minutes = (new Date(currentPhase.end_time) - new Date(currentPhase.start_time)) / 1000 / 60;
        phases.push(currentPhase);
        
        // Start new phase
        currentPhase = {
          start_index: i,
          start_time: metric.timestamp,
          turns: []
        };
      }
      
      currentPhase.turns.push(metric);
    }

    // Close final phase
    if (currentPhase.turns.length > 0) {
      currentPhase.end_index = flowMetrics.length - 1;
      currentPhase.end_time = flowMetrics[flowMetrics.length - 1].timestamp;
      currentPhase.duration_minutes = (new Date(currentPhase.end_time) - new Date(currentPhase.start_time)) / 1000 / 60;
      phases.push(currentPhase);
    }

    return phases;
  }

  /**
   * Interpret coherence score
   * @param {number} score - Coherence score
   * @returns {string} - Interpretation
   */
  interpretCoherence(score) {
    if (score > 0.7) return 'Very coherent conversation with consistent themes';
    if (score > 0.5) return 'Moderately coherent with some topic variation';
    if (score > 0.3) return 'Dynamic conversation with frequent topic shifts';
    return 'Highly exploratory conversation covering diverse topics';
  }

  /**
   * Create empty analysis result
   * @returns {Object} - Empty analysis
   */
  createEmptyAnalysis() {
    return {
      total_turns: 0,
      turn_analyses: [],
      flow_analysis: {
        flow_metrics: [],
        phases: [],
        overall_flow: {
          avg_similarity: 0,
          major_shifts: 0,
          continuous_percentage: 0,
          flow_stability: 'unknown'
        }
      },
      insights: {
        central_turns: [],
        outlier_turns: [],
        bridge_turns: [],
        callback_turns: [],
        topic_shifts: [],
        coherence: {
          score: 0,
          level: 'unknown',
          interpretation: 'No data to analyze'
        }
      },
      analysis_time: new Date()
    };
  }

  /**
   * Calculate cosine similarity between two vectors
   * @param {Array} a - First vector
   * @param {Array} b - Second vector
   * @returns {number} - Cosine similarity (0-1)
   */
  cosineSimilarity(a, b) {
    if (!a || !b || a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
/**
 * Attractor Analysis - Core mathematical analysis on sets of turns
 * Agnostic to how the turns were collected (single block, multiple blocks, etc.)
 */

export class AttractorAnalyzer {
  constructor(options = {}) {
    this.minClusterSize = options.minClusterSize || 3;
    this.maxDistance = options.maxDistance || 0.3;
    this.dimensions = options.dimensions || 1536;
  }

  /**
   * Find attractors in a set of turns using simple clustering
   * @param {Array} turns - Array of turn objects with content_embedding
   * @returns {Array} - Array of attractor objects
   */
  async findAttractors(turns) {
    if (!turns || turns.length === 0) {
      return [];
    }

    // Filter turns that have embeddings
    const turnsWithEmbeddings = turns.filter(turn => 
      turn.content_embedding && Array.isArray(turn.content_embedding)
    );

    if (turnsWithEmbeddings.length < this.minClusterSize) {
      return [];
    }

    // Simple clustering using distance-based grouping
    const clusters = this.performClustering(turnsWithEmbeddings);
    
    // Convert clusters to attractors
    return clusters.map(cluster => this.clusterToAttractor(cluster));
  }

  /**
   * Perform distance-based clustering
   * @param {Array} turns - Turns with embeddings
   * @returns {Array} - Array of clusters (each cluster is array of turns)
   */
  performClustering(turns) {
    const clusters = [];
    const processed = new Set();

    for (let i = 0; i < turns.length; i++) {
      if (processed.has(i)) continue;

      const cluster = [turns[i]];
      processed.add(i);

      // Find all turns within maxDistance of this turn
      for (let j = i + 1; j < turns.length; j++) {
        if (processed.has(j)) continue;

        const distance = this.cosineSimilarity(
          turns[i].content_embedding,
          turns[j].content_embedding
        );

        if (1 - distance <= this.maxDistance) {
          cluster.push(turns[j]);
          processed.add(j);
        }
      }

      // Only keep clusters that meet minimum size
      if (cluster.length >= this.minClusterSize) {
        clusters.push(cluster);
      }
    }

    return clusters;
  }

  /**
   * Convert a cluster of turns into an attractor object
   * @param {Array} cluster - Array of turns
   * @returns {Object} - Attractor object
   */
  clusterToAttractor(cluster) {
    const centroid = this.calculateCentroid(cluster.map(t => t.content_embedding));
    const strength = this.calculateStrength(cluster);
    const coherence = this.calculateCoherence(cluster);
    
    return {
      turn_count: cluster.length,
      centroid_embedding: centroid,
      strength: strength,
      coherence: coherence,
      turns: cluster.map(t => ({
        turn_id: t.turn_id,
        content: t.content,
        timestamp: t.timestamp,
        source_type: t.source_type
      })),
      representative_content: this.findRepresentativeContent(cluster, centroid),
      timespan: this.calculateTimespan(cluster),
      source_diversity: this.calculateSourceDiversity(cluster)
    };
  }

  /**
   * Calculate centroid (average) of embeddings
   * @param {Array} embeddings - Array of embedding vectors
   * @returns {Array} - Centroid embedding
   */
  calculateCentroid(embeddings) {
    if (embeddings.length === 0) return null;
    
    const centroid = new Array(this.dimensions).fill(0);
    
    for (const embedding of embeddings) {
      for (let i = 0; i < this.dimensions; i++) {
        centroid[i] += embedding[i];
      }
    }
    
    for (let i = 0; i < this.dimensions; i++) {
      centroid[i] /= embeddings.length;
    }
    
    return centroid;
  }

  /**
   * Calculate attractor strength based on cluster density and size
   * @param {Array} cluster - Array of turns
   * @returns {number} - Strength score (0-1)
   */
  calculateStrength(cluster) {
    if (cluster.length < 2) return 0;
    
    const embeddings = cluster.map(t => t.content_embedding);
    const centroid = this.calculateCentroid(embeddings);
    
    // Average distance from centroid (lower = stronger)
    const avgDistance = embeddings.reduce((sum, emb) => {
      return sum + (1 - this.cosineSimilarity(emb, centroid));
    }, 0) / embeddings.length;
    
    // Combine density and size effects
    const densityScore = Math.max(0, 1 - (avgDistance / this.maxDistance));
    const sizeScore = Math.min(1, cluster.length / 10); // Normalize to max of 10 turns
    
    return (densityScore * 0.7) + (sizeScore * 0.3);
  }

  /**
   * Calculate coherence - how consistent the cluster is
   * @param {Array} cluster - Array of turns
   * @returns {number} - Coherence score (0-1)
   */
  calculateCoherence(cluster) {
    if (cluster.length < 2) return 1;
    
    const embeddings = cluster.map(t => t.content_embedding);
    let totalSimilarity = 0;
    let pairCount = 0;
    
    // Calculate average pairwise similarity
    for (let i = 0; i < embeddings.length; i++) {
      for (let j = i + 1; j < embeddings.length; j++) {
        totalSimilarity += this.cosineSimilarity(embeddings[i], embeddings[j]);
        pairCount++;
      }
    }
    
    return pairCount > 0 ? totalSimilarity / pairCount : 0;
  }

  /**
   * Find the turn whose content is most representative of the cluster
   * @param {Array} cluster - Array of turns
   * @param {Array} centroid - Centroid embedding
   * @returns {Object} - Most representative turn
   */
  findRepresentativeContent(cluster, centroid) {
    let bestTurn = cluster[0];
    let bestSimilarity = this.cosineSimilarity(cluster[0].content_embedding, centroid);
    
    for (let i = 1; i < cluster.length; i++) {
      const similarity = this.cosineSimilarity(cluster[i].content_embedding, centroid);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestTurn = cluster[i];
      }
    }
    
    return {
      turn_id: bestTurn.turn_id,
      content: bestTurn.content,
      similarity_to_centroid: bestSimilarity
    };
  }

  /**
   * Calculate time span of cluster
   * @param {Array} cluster - Array of turns
   * @returns {Object} - Time span info
   */
  calculateTimespan(cluster) {
    if (cluster.length === 0) return null;
    
    const timestamps = cluster.map(t => new Date(t.timestamp)).sort();
    const start = timestamps[0];
    const end = timestamps[timestamps.length - 1];
    
    return {
      start_time: start,
      end_time: end,
      duration_ms: end - start,
      temporal_density: cluster.length / Math.max(1, (end - start) / 1000 / 60) // turns per minute
    };
  }

  /**
   * Calculate diversity of source types in cluster
   * @param {Array} cluster - Array of turns
   * @returns {Object} - Source diversity info
   */
  calculateSourceDiversity(cluster) {
    const sourceCounts = {};
    
    for (const turn of cluster) {
      sourceCounts[turn.source_type] = (sourceCounts[turn.source_type] || 0) + 1;
    }
    
    const sourceTypes = Object.keys(sourceCounts);
    const totalTurns = cluster.length;
    
    // Calculate entropy as measure of diversity
    let entropy = 0;
    for (const count of Object.values(sourceCounts)) {
      const prob = count / totalTurns;
      entropy -= prob * Math.log2(prob);
    }
    
    return {
      source_types: sourceTypes,
      source_counts: sourceCounts,
      diversity_score: entropy,
      is_mixed: sourceTypes.length > 1
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

  /**
   * Analyze topology of attractors
   * @param {Array} attractors - Array of attractor objects
   * @returns {Object} - Topology analysis
   */
  analyzeTopology(attractors) {
    if (attractors.length === 0) {
      return { type: 'empty', energy: 0 };
    }
    
    const totalTurns = attractors.reduce((sum, a) => sum + a.turn_count, 0);
    const avgStrength = attractors.reduce((sum, a) => sum + a.strength, 0) / attractors.length;
    const strengthVariance = this.calculateVariance(attractors.map(a => a.strength));
    
    let topologyType;
    if (attractors.length === 1) {
      topologyType = 'single_attractor';
    } else if (attractors.length === 2) {
      topologyType = strengthVariance < 0.1 ? 'binary_star' : 'dominant_secondary';
    } else {
      const maxStrength = Math.max(...attractors.map(a => a.strength));
      topologyType = maxStrength > 0.7 ? 'planetary' : 'multi_attractor';
    }
    
    return {
      type: topologyType,
      attractor_count: attractors.length,
      total_turns: totalTurns,
      avg_strength: avgStrength,
      strength_variance: strengthVariance,
      energy: this.calculateSystemEnergy(attractors),
      strongest_attractor: attractors.reduce((max, a) => a.strength > max.strength ? a : max, attractors[0])
    };
  }

  /**
   * Calculate system energy level
   * @param {Array} attractors - Array of attractors
   * @returns {number} - Energy level (0-1)
   */
  calculateSystemEnergy(attractors) {
    if (attractors.length === 0) return 0;
    
    const avgStrength = attractors.reduce((sum, a) => sum + a.strength, 0) / attractors.length;
    const strengthVariance = this.calculateVariance(attractors.map(a => a.strength));
    
    // High energy = low average strength (exploring) OR high variance (dynamic)
    return Math.max(
      1 - avgStrength,           // Exploration energy
      Math.min(1, strengthVariance * 2)  // Dynamic energy
    );
  }

  /**
   * Calculate variance of array
   * @param {Array} values - Array of numbers
   * @returns {number} - Variance
   */
  calculateVariance(values) {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  }
}
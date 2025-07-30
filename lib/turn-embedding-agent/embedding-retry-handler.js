/**
 * Embedding Retry Handler - Handle embedding generation with retry logic
 */

import { EmbeddingService } from '../embedding-service.js';

export class EmbeddingRetryHandler {
  constructor(options = {}) {
    this.embeddingService = options.embeddingService || new EmbeddingService();
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 1000;
  }

  /**
   * Generate embedding with retry logic
   */
  async generateEmbeddingWithRetry(content, attempt = 1) {
    try {
      const embedding = await this.embeddingService.generateEmbedding(content);
      return this.embeddingService.formatForDatabase(embedding);
      
    } catch (error) {
      if (attempt < this.retryAttempts) {
        console.log(`[EmbeddingRetry] Retry attempt ${attempt} for embedding generation`);
        await this.delay(this.retryDelay * attempt);
        return this.generateEmbeddingWithRetry(content, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Health check for embedding service
   */
  async healthCheck() {
    try {
      await this.embeddingService.generateEmbedding('health check');
      return { status: 'healthy', service: 'embedding' };
    } catch (error) {
      return { status: 'unhealthy', service: 'embedding', error: error.message };
    }
  }

  /**
   * Simple delay utility
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
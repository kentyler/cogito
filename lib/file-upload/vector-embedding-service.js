/**
 * Vector Embedding Service
 * Stub implementation for server startup
 */

export class VectorEmbeddingService {
  async generateEmbedding(text) {
    // Return empty embedding for now
    return [];
  }
  
  async findSimilarChunks(embedding, limit = 5) {
    // Return empty results for now
    return [];
  }
}

export default VectorEmbeddingService;
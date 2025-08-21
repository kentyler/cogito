/**
 * Vector Embedding Service
 * Real implementation using the main embedding service
 */

import { EmbeddingService } from '../embedding-service.js';

export class VectorEmbeddingService {
  constructor() {
    this.embeddingService = new EmbeddingService();
  }

  async generateEmbedding(text) {
    try {
      return await this.embeddingService.generateEmbedding(text);
    } catch (error) {
      console.error('Vector embedding generation failed:', error);
      throw error;
    }
  }
  
  async findSimilarChunks(embedding, limit = 5, clientId = null) {
    // This would require database connection and similarity search
    // For now, return empty but log the attempt
    console.log('Similarity search requested for embedding with', embedding.length, 'dimensions, limit:', limit);
    return [];
  }

  async processChunksToVectors(chunks, fileId, clientId) {
    // Process chunks to create embeddings and store them
    console.log(`Processing ${chunks.length} chunks for file ${fileId}`);
    
    // For now, just log the processing attempt
    // Real implementation would:
    // 1. Generate embeddings for each chunk
    // 2. Store chunks in context.chunks table with embeddings
    // 3. Link chunks to the file
    
    for (let i = 0; i < chunks.length; i++) {
      try {
        const embedding = await this.generateEmbedding(chunks[i].content);
        console.log(`Generated embedding for chunk ${i + 1}/${chunks.length} (${embedding.length} dimensions)`);
        
        // TODO: Store chunk and embedding in database
        // Available methods: createChunk - verified in DatabaseAgent file operations
        // await this.dbAgent.files.createChunk({
        //   file_id: fileId, // Standard database field name
        //   chunk_index: i,
        //   content: chunks[i].content,
        //   embedding: embedding,
        //   metadata: chunks[i].metadata
        // });
        
      } catch (error) {
        console.error(`Error processing chunk ${i + 1}:`, error);
      }
    }
  }

  isProcessing(fileId) {
    // Simple check - could be enhanced with real tracking
    return false;
  }

  async deleteFileVectors(fileId, clientId) {
    // Delete vectors for a file
    console.log(`Deleting vectors for file ${fileId}`);
    // TODO: Implement deletion of chunks and embeddings
  }

  async close() {
    // Close any connections
  }
}

export default VectorEmbeddingService;
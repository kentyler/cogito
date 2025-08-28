/**
 * Embedding Service for generating OpenAI embeddings
 * Standardized on text-embedding-3-small (1536 dimensions)
 */

import OpenAI from 'openai';

export class EmbeddingService {
  constructor(apiKey = process.env.OPENAI_API_KEY) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required for embedding service');
    }
    
    this.openai = new OpenAI({ apiKey });
    this.model = 'text-embedding-3-small';
    this.dimensions = 1536;
  }

  /**
   * Generate embedding for text content
   * @param {string} text - Text to embed
   * @returns {Promise<number[]>} - Embedding vector
   */
  async generateEmbedding(text) {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new Error('Text content is required for embedding generation');
    }

    try {
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: text.substring(0, 8000), // Truncate to avoid token limits
        encoding_format: 'float'
      });
      
      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error.message);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   * @param {string[]} texts - Array of texts to embed
   * @param {number} batchSize - Number of texts to process at once
   * @returns {Promise<number[][]>} - Array of embedding vectors
   */
  async generateEmbeddings(texts, batchSize = 100) {
    if (!Array.isArray(texts) || texts.length === 0) {
      throw new Error('Array of texts is required for batch embedding generation');
    }

    const embeddings = [];
    
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      
      try {
        const response = await this.openai.embeddings.create({
          model: this.model,
          input: batch.map(text => text.substring(0, 8000)),
          encoding_format: 'float'
        });
        
        embeddings.push(...response.data.map(item => item.embedding));
        
        // Rate limiting - small delay between batches
        if (i + batchSize < texts.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (error) {
        console.error(`Error generating batch embeddings (batch ${Math.floor(i / batchSize) + 1}):`, error.message);
        throw new Error(`Failed to generate batch embeddings: ${error.message}`);
      }
    }
    
    return embeddings;
  }

  /**
   * Convert embedding array to pgvector format string
   * @param {number[]} embedding - Embedding vector
   * @returns {string} - pgvector compatible string
   */
  formatForDatabase(embedding) {
    if (!Array.isArray(embedding) || embedding.length !== this.dimensions) {
      throw new Error(`Embedding must be an array of ${this.dimensions} numbers`);
    }
    
    return `[${embedding.join(',')}]`;
  }

  /**
   * Calculate cosine similarity between two embeddings
   * @param {number[]} embedding1 - First embedding
   * @param {number[]} embedding2 - Second embedding
   * @returns {number} - Cosine similarity score (0-1)
   */
  cosineSimilarity(embedding1, embedding2) {
    if (!Array.isArray(embedding1) || !Array.isArray(embedding2)) {
      throw new Error('Both embeddings must be arrays');
    }
    
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same length');
    }
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Get model information
   * @returns {object} - Model details
   */
  getModelInfo() {
    return {
      model: this.model,
      dimensions: this.dimensions,
      maxTokens: 8000
    };
  }
}

// Default instance for easy importing
export const embeddingService = new EmbeddingService();
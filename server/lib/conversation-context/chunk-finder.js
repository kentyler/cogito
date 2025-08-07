/**
 * Find similar file chunks using embedding similarity
 */
export async function findSimilarChunks(pool, embeddingService, content, clientId, limit = 5, minSimilarity = 0.6) {
  try {
    // Validate content before generating embedding
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      console.warn('Empty or invalid content for embedding generation:', content);
      return [];
    }
    
    // Generate embedding for the user's content
    const queryEmbedding = await embeddingService.generateEmbedding(content);
    const embeddingString = embeddingService.formatForDatabase(queryEmbedding);
    
    const query = `
      SELECT 
        c.id as chunk_id,
        c.content,
        f.filename,
        f.source_type,
        f.created_at,
        1 - (c.embedding_vector <=> $1) as similarity
      FROM context.chunks c
      JOIN context.files f ON c.file_id = f.id
      WHERE c.client_id = $2
      AND c.embedding_vector IS NOT NULL
      AND 1 - (c.embedding_vector <=> $1) >= $3
      ORDER BY similarity DESC
      LIMIT $4
    `;
    
    const result = await pool.query(query, [embeddingString, clientId, minSimilarity, limit]);
    return result.rows;
  } catch (error) {
    console.error('Error finding similar chunks:', error);
    return [];
  }
}
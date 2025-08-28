/**
 * Find similar file chunks using embedding similarity
 * Supports mini-horde inheritance: searches own client + parent client data
 */
export async function findSimilarChunks(pool, embeddingService, content, clientId, limit = 5, minSimilarity = 0.6, parentClientId = null) {
  try {
    // Validate content before generating embedding
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      console.warn('Empty or invalid content for embedding generation:', content);
      return [];
    }
    
    // Generate embedding for the user's content
    const queryEmbedding = await embeddingService.generateEmbedding(content);
    const embeddingString = embeddingService.formatForDatabase(queryEmbedding);
    
    // Build client filter for mini-horde support
    let clientFilter, queryParams;
    if (parentClientId) {
      // Mini-horde: search both own client AND parent client data
      clientFilter = `WHERE c.client_id IN ($2, $3)`;
      queryParams = [embeddingString, clientId, parentClientId, minSimilarity, limit];
    } else {
      // Regular client: search only own client data
      clientFilter = `WHERE c.client_id = $2`;
      queryParams = [embeddingString, clientId, minSimilarity, limit];
    }

    const query = `
      SELECT 
        c.id as chunk_id,
        c.content,
        f.filename,
        f.source_type,
        f.created_at,
        c.client_id,
        CASE 
          WHEN c.client_id = $2 THEN 'own'
          ELSE 'parent'
        END as data_source,
        1 - (c.embedding_vector <=> $1) as similarity
      FROM context.chunks c
      JOIN context.files f ON c.file_id = f.id
      ${clientFilter}
      AND c.embedding_vector IS NOT NULL
      AND 1 - (c.embedding_vector <=> $1) >= ${parentClientId ? '$4' : '$3'}
      ORDER BY similarity DESC
      LIMIT ${parentClientId ? '$5' : '$4'}
    `;
    
    const result = await pool.query(query, queryParams);
    return result.rows;
  } catch (error) {
    console.error('Error finding similar chunks:', error);
    return [];
  }
}
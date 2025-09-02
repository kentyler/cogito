import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Chunk text into smaller pieces for processing
 * @param {Object} options
 * @param {string} options.textContent - Text content to chunk
 * @param {number} [options.maxChunkSize=2000] - Maximum size per chunk
 * @returns {Array<string>} Array of text chunks
 */
export function chunkText({ textContent, maxChunkSize = 2000 }) {
  const chunks = [];
  const lines = textContent.split('\n');
  let currentChunk = '';
  
  for (const line of lines) {
    if (currentChunk.length + line.length + 1 > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = line;
    } else {
      currentChunk += (currentChunk ? '\n' : '') + line;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

// Generate embedding for text
export async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      dimensions: 1536
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return null;
  }
}

/**
 * Process file and store chunks with embeddings
 * @param {Object} options
 * @param {Object} options.client - Database client with query method
 * @param {string} options.fileId - File ID to associate chunks with
 * @param {string} options.content - Text content to process
 * @param {string} options.clientId - Client ID for chunk association
 * @returns {Promise<number>} Number of chunks created
 */
export async function processFileContent({ client, fileId, content, clientId }) {
  const chunks = chunkText({ textContent: content });
  
  for (let i = 0; i < chunks.length; i++) {
    const chunkText = chunks[i];
    const embedding = await generateEmbedding(chunkText);
    
    await client.query(`
      INSERT INTO context.chunks 
      (file_id, content, embedding_vector, chunk_index, client_id, metadata)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      fileId,
      chunkText,
      embedding ? `[${embedding.join(',')}]` : null,
      i,
      clientId,
      JSON.stringify({
        chunk_size: chunkText.length,
        total_chunks: chunks.length
      })
    ]);
  }
  
  return chunks.length;
}
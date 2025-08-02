import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Chunk text into smaller pieces
export function chunkText(text, maxChunkSize = 2000) {
  const chunks = [];
  const lines = text.split('\n');
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

// Process file and store chunks with embeddings
export async function processFileContent(client, fileId, content, clientId) {
  const chunks = chunkText(content);
  
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
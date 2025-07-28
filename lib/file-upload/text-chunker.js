/**
 * Text Chunker - Split text into overlapping chunks for vector processing
 */

export class TextChunker {
  /**
   * Split text into overlapping chunks
   * @param {string} text - Text to chunk
   * @param {number} chunkSize - Maximum chunk size in characters
   * @param {number} overlap - Overlap between chunks in characters
   * @returns {Array} - Array of text chunks
   */
  chunkText(text, chunkSize = 1000, overlap = 200) {
    if (!text || text.trim().length === 0) {
      return [];
    }

    const chunks = [];
    let start = 0;
    
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      const chunk = text.slice(start, end);
      
      if (chunk.trim().length > 0) {
        chunks.push(chunk.trim());
      }
      
      // Ensure we always make progress
      const nextStart = end - overlap;
      start = Math.max(nextStart, start + 1);
      
      // If we've reached the end, break
      if (end >= text.length) break;
    }
    
    return chunks;
  }

  /**
   * Split text into chunks by sentences (respecting sentence boundaries)
   * @param {string} text - Text to chunk
   * @param {number} maxChunkSize - Maximum chunk size in characters
   * @param {number} overlap - Overlap between chunks in characters
   * @returns {Array} - Array of text chunks
   */
  chunkBySentences(text, maxChunkSize = 1000, overlap = 200) {
    if (!text || text.trim().length === 0) {
      return [];
    }

    // Split into sentences (basic implementation)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks = [];
    let currentChunk = '';
    
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      const potentialChunk = currentChunk + (currentChunk ? '. ' : '') + sentence;
      
      if (potentialChunk.length <= maxChunkSize) {
        currentChunk = potentialChunk;
      } else {
        // Add current chunk if it has content
        if (currentChunk) {
          chunks.push(currentChunk + '.');
        }
        
        // Start new chunk with current sentence
        currentChunk = sentence;
        
        // If single sentence is too long, fall back to character chunking
        if (sentence.length > maxChunkSize) {
          const subChunks = this.chunkText(sentence, maxChunkSize, overlap);
          chunks.push(...subChunks);
          currentChunk = '';
        }
      }
    }
    
    // Add final chunk if it has content
    if (currentChunk) {
      chunks.push(currentChunk + '.');
    }
    
    return chunks;
  }

  /**
   * Split text into chunks by paragraphs
   * @param {string} text - Text to chunk
   * @param {number} maxChunkSize - Maximum chunk size in characters
   * @returns {Array} - Array of text chunks
   */
  chunkByParagraphs(text, maxChunkSize = 1000) {
    if (!text || text.trim().length === 0) {
      return [];
    }

    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const chunks = [];
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
      const trimmedParagraph = paragraph.trim();
      const potentialChunk = currentChunk + (currentChunk ? '\n\n' : '') + trimmedParagraph;
      
      if (potentialChunk.length <= maxChunkSize) {
        currentChunk = potentialChunk;
      } else {
        // Add current chunk if it has content
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        
        // If single paragraph is too long, split it further
        if (trimmedParagraph.length > maxChunkSize) {
          const subChunks = this.chunkBySentences(trimmedParagraph, maxChunkSize);
          chunks.push(...subChunks);
          currentChunk = '';
        } else {
          currentChunk = trimmedParagraph;
        }
      }
    }
    
    // Add final chunk if it has content
    if (currentChunk) {
      chunks.push(currentChunk);
    }
    
    return chunks;
  }

  /**
   * Get optimal chunking strategy based on text characteristics
   * @param {string} text - Text to analyze
   * @returns {string} - Recommended chunking strategy
   */
  getOptimalStrategy(text) {
    if (!text || text.trim().length === 0) {
      return 'character';
    }

    const paragraphs = text.split(/\n\s*\n/).length;
    const sentences = text.split(/[.!?]+/).length;
    const avgParagraphLength = text.length / paragraphs;
    const avgSentenceLength = text.length / sentences;

    // If paragraphs are reasonable size, use paragraph chunking
    if (avgParagraphLength < 800 && paragraphs > 2) {
      return 'paragraph';
    }
    
    // If sentences are reasonable size, use sentence chunking
    if (avgSentenceLength < 400 && sentences > 5) {
      return 'sentence';
    }
    
    // Fall back to character chunking
    return 'character';
  }

  /**
   * Chunk text using optimal strategy
   * @param {string} text - Text to chunk
   * @param {number} maxChunkSize - Maximum chunk size
   * @param {number} overlap - Overlap between chunks
   * @returns {Array} - Array of text chunks
   */
  chunkOptimal(text, maxChunkSize = 1000, overlap = 200) {
    const strategy = this.getOptimalStrategy(text);
    
    switch (strategy) {
      case 'paragraph':
        return this.chunkByParagraphs(text, maxChunkSize);
      case 'sentence':
        return this.chunkBySentences(text, maxChunkSize, overlap);
      default:
        return this.chunkText(text, maxChunkSize, overlap);
    }
  }
}
/**
 * Format conversation context with source references
 */

export function formatPastDiscussions(similarTurns, clientId) {
  let context = '';
  const sources = [];
  let sourceIndex = 1;
  
  // Filter by client_id if available
  const clientFilteredTurns = clientId 
    ? similarTurns.filter(turn => turn.client_id === clientId)
    : similarTurns;
  
  if (clientFilteredTurns.length > 0) {
    context = `\n\n=== RELEVANT PAST DISCUSSIONS (from your organization) ===\n`;
    context += `[These are actual conversations from your team members]\n\n`;
    
    clientFilteredTurns.forEach((turn, idx) => {
      const refId = `[REF-${sourceIndex}]`;
      sources.push({
        id: sourceIndex,
        type: 'discussion',
        content: turn.content,
        timestamp: turn.timestamp,
        similarity: turn.similarity?.toFixed(2)
      });
      
      context += `${refId} ${turn.content}\n`;
      if (turn.response_content) {
        context += `    → Response: ${turn.response_content}\n`;
      }
      context += '\n';
      sourceIndex++;
    });
    
    console.log(`📚 Found ${clientFilteredTurns.length} relevant past discussions for context`);
  } else if (similarTurns.length > 0) {
    console.log(`📚 Found ${similarTurns.length} similar turns but none for client ${clientId}`);
  }
  
  return { context, sources, nextIndex: sourceIndex };
}

export function formatFileChunks(similarChunks, startIndex = 1) {
  let context = '';
  const sources = [];
  let sourceIndex = startIndex;
  
  if (similarChunks.length > 0) {
    context = `=== CONTENT FROM YOUR UPLOADED FILES ===\n`;
    context += `[These are excerpts from documents your team has uploaded]\n\n`;
    
    similarChunks.forEach((chunk, idx) => {
      const refId = `[REF-${sourceIndex}]`;
      sources.push({
        id: sourceIndex,
        type: 'file',
        content: chunk.content,
        filename: chunk.filename,
        uploadDate: chunk.created_at,
        similarity: chunk.similarity?.toFixed(2)
      });
      
      context += `${refId} From file "${chunk.filename}":\n`;
      context += `${chunk.content}\n\n`;
      sourceIndex++;
    });
    
    console.log(`📄 Found ${similarChunks.length} relevant file chunks for context`);
  }
  
  return { context, sources };
}

export function formatSourceReferences(sources) {
  if (sources.length === 0) return '';
  
  let context = `\n=== SOURCE REFERENCE DETAILS ===\n`;
  context += `IMPORTANT: When citing these references, explain what each one contains.\n\n`;
  
  sources.forEach(source => {
    if (source.type === 'discussion') {
      // Extract first 100 chars of content as preview
      const preview = source.content ? source.content.substring(0, 100) + '...' : '';
      const timestamp = source.timestamp ? new Date(source.timestamp).toLocaleDateString() : 'unknown date';
      context += `[REF-${source.id}]: Past discussion from ${timestamp} about "${preview}" (similarity: ${source.similarity})\n`;
    } else if (source.type === 'file') {
      const preview = source.content ? source.content.substring(0, 100) + '...' : '';
      context += `[REF-${source.id}]: File "${source.filename}" containing "${preview}" (similarity: ${source.similarity})\n`;
    }
  });
  context += `\n=== END REFERENCES ===\n\n`;
  
  return context;
}
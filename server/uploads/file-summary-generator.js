/**
 * File Summary Generator - Generates brief summaries of uploaded files
 */

/**
 * Generate a brief summary of uploaded file content
 */
export function generateFileSummary(content, filename) {
  if (!content || content.trim().length === 0) {
    return `Empty file`;
  }
  
  const lines = content.split('\n').filter(line => line.trim().length > 0);
  const wordCount = content.split(/\s+/).length;
  
  // Extract first meaningful line as preview
  const preview = lines[0]?.substring(0, 100) || '';
  const previewSuffix = preview.length === 100 ? '...' : '';
  
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  const fileType = {
    '.txt': 'Text document',
    '.md': 'Markdown document',
    '.pdf': 'PDF document'
  }[ext] || 'Document';
  
  return `${fileType} with ${wordCount} words, ${lines.length} lines. ${preview}${previewSuffix}`;
}
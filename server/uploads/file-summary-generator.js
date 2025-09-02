/**
 * File Summary Generator - Generates brief summaries of uploaded files
 */

/**
 * Generate a brief summary of uploaded file content
 * @param {Object} options
 * @param {string} options.fileContent - Content of the file to summarize
 * @param {string} options.filename - Name of the file
 * @returns {string} Brief summary of the file content
 */
export function generateFileSummary({ fileContent, filename }) {
  if (!fileContent || fileContent.trim().length === 0) {
    return `Empty file`;
  }
  
  const lines = fileContent.split('\n').filter(line => line.trim().length > 0);
  const wordCount = fileContent.split(/\s+/).length;
  
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
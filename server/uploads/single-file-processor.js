/**
 * Single File Processor - Routes files to appropriate processors
 */

import { ThinkingToolProcessor } from '../../uploads/file-upload/thinking-tool-processor.js';
import { processRegularFile } from './regular-file-processor.js';

/**
 * Process a single uploaded file
 * @param {Object} options
 * @param {Object} options.db - Database connection/pool
 * @param {Object} options.file - Multer file object with originalname, buffer, size, mimetype
 * @param {string} options.clientId - Client ID for file association
 * @param {string} options.userId - User ID who uploaded the file
 * @param {string} options.meetingId - Meeting ID for context
 * @returns {Promise<Object>} File processing result
 */
export async function processFile({ db, file, clientId, userId, meetingId }) {
  const { originalname, buffer, size, mimetype } = file;
  const ext = originalname.toLowerCase().substring(originalname.lastIndexOf('.'));
  
  // Handle .cogito files specially
  if (ext === '.cogito') {
    const processor = new ThinkingToolProcessor();
    const result = await processor.process(
      buffer, 
      { name: originalname, size, mimetype }, 
      clientId, 
      userId, 
      meetingId
    );
    
    return {
      filename: originalname,
      size,
      type: 'thinking_tool',
      success: true,
      analysis: result.analysis,
      insights: result.insights,
      suggestions: result.suggestions,
      submissionId: result.submissionId
    };
  }
  
  // Handle regular files
  return await processRegularFile({ db, file, clientId, userId });
}
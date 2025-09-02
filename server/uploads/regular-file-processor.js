/**
 * Regular File Processor - Handles .txt, .md, .pdf files
 */

import { extractTextFromPDF, isPDF } from './pdf-processor.js';
import { processFileContent } from './file-processor.js';
import { generateFileSummary } from './file-summary-generator.js';

/**
 * Process regular files (.txt, .md, .pdf)
 * @param {Object} options
 * @param {Object} options.db - Database connection/pool
 * @param {Object} options.file - Multer file object with originalname, buffer, size, mimetype
 * @param {string} options.clientId - Client ID for file association
 * @param {string} options.userId - User ID who uploaded the file
 * @returns {Promise<Object>} File processing result with file_id and metadata
 */
export async function processRegularFile({ db, file, clientId, userId }) {
  const { originalname, buffer, size, mimetype } = file;
  
  // Extract text content based on file type
  let content;
  let extractedMetadata = {};
  
  if (isPDF({ filename: originalname, mimeType: mimetype })) {
    try {
      const pdfData = await extractTextFromPDF(buffer);
      content = pdfData.text;
      extractedMetadata = {
        pdf_info: pdfData.info,
        pdf_pages: pdfData.pages,
        pdf_version: pdfData.version
      };
    } catch (pdfError) {
      throw new Error(`PDF processing failed: ${pdfError.message}`);
    }
  } else {
    // For text files, convert buffer to string
    content = buffer.toString('utf-8');
  }
  
  try {
    await db.connector.query('BEGIN');
    
    // Store file in database
    const fileResult = await db.connector.query(`
      INSERT INTO context.files 
      (filename, content_data, content_type, file_size, source_type, client_id, metadata) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *
    `, [
      originalname,
      buffer,
      mimetype || 'text/plain',
      size,
      'upload',
      clientId,
      JSON.stringify({
        uploaded_by: userId,
        uploaded_at: new Date().toISOString(),
        source: 'conversation-drop',
        ...extractedMetadata
      })
    ]);
    
    const storedFile = fileResult.rows[0];
    
    // Process file content for chunking and embedding
    const chunkCount = await processFileContent({
      client: { query: db.connector.query.bind(db.connector) },
      fileId: storedFile.id,
      content,
      clientId
    });
    
    await db.connector.query('COMMIT');
    
    // Generate summary for conversation response
    const summary = generateFileSummary({ fileContent: content, filename: originalname });
    
    return {
      filename: originalname,
      size,
      type: 'document',
      success: true,
      summary,
      chunks: chunkCount,
      fileId: storedFile.id,
      uploadedAt: storedFile.created_at
    };
    
  } catch (error) {
    await db.connector.query('ROLLBACK');
    throw error;
  }
}
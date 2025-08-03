/**
 * Extract text and metadata from PDF buffer
 * @param {Buffer} buffer - PDF file buffer
 * @returns {Promise<object>} - Extracted text and metadata
 */
export async function extractTextFromPDF(buffer) {
  try {
    // Dynamic import to avoid pdf-parse loading test files on startup
    const pdf = (await import('pdf-parse')).default;
    const data = await pdf(buffer);
    
    // Clean up the extracted text
    const cleanedText = data.text
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
      .trim();
    
    return {
      text: cleanedText,
      pages: data.numpages,
      info: {
        title: data.info?.Title || null,
        author: data.info?.Author || null,
        subject: data.info?.Subject || null,
        keywords: data.info?.Keywords || null,
        creator: data.info?.Creator || null,
        producer: data.info?.Producer || null,
        creationDate: data.info?.CreationDate || null,
        modDate: data.info?.ModDate || null,
        pages: data.numpages
      },
      version: data.version
    };
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

/**
 * Check if a file is a PDF based on extension or MIME type
 * @param {string} filename - File name
 * @param {string} mimetype - MIME type
 * @returns {boolean} - True if file is a PDF
 */
export function isPDF(filename, mimetype) {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return ext === '.pdf' || mimetype === 'application/pdf';
}
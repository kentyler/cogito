import PDFParser from 'pdf2json';

/**
 * Extract text and metadata from PDF buffer
 * @param {Buffer} buffer - PDF file buffer
 * @returns {Promise<object>} - Extracted text and metadata
 */
export async function extractTextFromPDF(buffer) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();
    
    pdfParser.on('pdfParser_dataError', errData => {
      console.error('PDF parsing error:', errData.parserError);
      reject(new Error(`Failed to parse PDF: ${errData.parserError}`));
    });
    
    pdfParser.on('pdfParser_dataReady', pdfData => {
      try {
        // Extract text from all pages
        let fullText = '';
        const pages = pdfData.Pages || [];
        
        pages.forEach((page, pageIndex) => {
          if (pageIndex > 0) fullText += '\n\n';
          
          const texts = page.Texts || [];
          texts.forEach(text => {
            const textRuns = text.R || [];
            textRuns.forEach(run => {
              if (run.T) {
                // Decode URI-encoded text
                const decodedText = decodeURIComponent(run.T);
                fullText += decodedText;
              }
            });
          });
        });
        
        // Clean up the extracted text
        const cleanedText = fullText
          .replace(/\r\n/g, '\n') // Normalize line endings
          .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
          .trim();
        
        // Extract metadata
        const metadata = pdfData.Meta || {};
        
        resolve({
          text: cleanedText,
          pages: pages.length,
          info: {
            title: metadata.Title || null,
            author: metadata.Author || null,
            subject: metadata.Subject || null,
            keywords: metadata.Keywords || null,
            creator: metadata.Creator || null,
            producer: metadata.Producer || null,
            creationDate: metadata.CreationDate || null,
            modDate: metadata.ModDate || null,
            pages: pages.length
          },
          version: metadata.PDFFormatVersion || null
        });
      } catch (error) {
        reject(new Error(`Failed to process PDF data: ${error.message}`));
      }
    });
    
    // Parse the buffer
    pdfParser.parseBuffer(buffer);
  });
}

/**
 * Check if a file is a PDF based on extension or MIME type
 * @param {Object} options
 * @param {string} options.filename - File name to check
 * @param {string} options.mimeType - MIME type of the file
 * @returns {boolean} True if file is a PDF
 */
export function isPDF({ filename, mimeType }) {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return ext === '.pdf' || mimeType === 'application/pdf';
}
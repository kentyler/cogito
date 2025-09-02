import { processFileContent } from './file-processor.js';
import { extractTextFromPDF, isPDF } from './pdf-processor.js';

// Create text file handler
export async function createTextFile(req, res) {
  try {
    const { title, content } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    
    const client_id = req.session?.user?.client_id;
    if (!client_id) {
      return res.status(401).json({ error: 'Authentication required - no client selected' });
    }
    
    const filename = title.endsWith('.txt') || title.endsWith('.md') 
      ? title 
      : `${title}.txt`;
    
    const buffer = Buffer.from(content, 'utf-8');
    const size = buffer.length;
    
    const client = await req.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const fileResult = await client.query(`
        INSERT INTO context.files 
        (filename, content_data, content_type, file_size, source_type, client_id, metadata) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) 
        RETURNING *
      `, [
        filename,
        buffer,
        'text/plain',
        size,
        'text-input',
        client_id,
        JSON.stringify({
          created_by: req.session?.user?.email || 'anonymous',
          created_at: new Date().toISOString(),
          source: 'text-input'
        })
      ]);
      
      const file = fileResult.rows[0];
      const chunkCount = await processFileContent(client, file.id, content, client_id);
      
      await client.query('COMMIT');
      
      res.json({
        id: file.id,
        filename: file.filename,
        size: file.file_size,
        chunks: chunkCount,
        uploaded_at: file.created_at,
        content: content,
        source_type: 'text-input'
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Text file creation error:', error);
    res.status(500).json({ error: error.message || 'Failed to create text file' });
  }
}

// Upload file handler
export async function uploadFile(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { originalname, buffer, size, mimetype } = req.file;
    
    // Extract text content based on file type
    let content;
    let extractedMetadata = {};
    
    if (isPDF({ filename: originalname, mimeType: mimetype })) {
      // Extract text from PDF
      try {
        const pdfData = await extractTextFromPDF(buffer);
        content = pdfData.text;
        extractedMetadata = {
          pdf_info: pdfData.info,
          pdf_pages: pdfData.pages,
          pdf_version: pdfData.version
        };
      } catch (pdfError) {
        return res.status(400).json({ error: `PDF processing failed: ${pdfError.message}` });
      }
    } else {
      // For text files, just convert buffer to string
      content = buffer.toString('utf-8');
    }
    
    const client_id = req.session?.user?.client_id;
    if (!client_id) {
      return res.status(401).json({ error: 'Authentication required - no client selected' });
    }
    
    const client = await req.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const fileResult = await client.query(`
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
        client_id,
        JSON.stringify({
          uploaded_by: req.session?.user?.email || 'anonymous',
          uploaded_at: new Date().toISOString(),
          ...extractedMetadata
        })
      ]);
      
      const file = fileResult.rows[0];
      const chunkCount = await processFileContent(client, file.id, content, client_id);
      
      await client.query('COMMIT');
      
      res.json({
        id: file.id,
        filename: file.filename,
        size: file.file_size,
        chunks: chunkCount,
        uploaded_at: file.created_at
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload file' });
  }
}
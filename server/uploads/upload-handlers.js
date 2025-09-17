import { extractTextFromPDF, isPDF } from './pdf-processor.js';
import { TurnProcessor } from '../../lib/turn-processor.js';

// Create text file handler - now creates turns directly
export async function createTextFile(req, res) {
  try {
    const { title, content } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    
    const client_id = req.session?.user?.client_id;
    const user_id = req.session?.user?.user_id;
    
    if (!client_id) {
      return res.status(401).json({ error: 'Authentication required - no client selected' });
    }
    
    const filename = title.endsWith('.txt') || title.endsWith('.md') 
      ? title 
      : `${title}.txt`;
    
    // Create TurnProcessor instance
    const turnProcessor = new TurnProcessor();
    
    // Create turn data for the file content
    const turnData = {
      client_id: client_id,
      user_id: user_id,
      content: content,
      source_type: 'file_upload',
      meeting_id: null, // File uploads are not associated with meetings
      metadata: {
        filename: filename,
        content_type: 'text/plain',
        file_size: content.length,
        source: 'text-input',
        created_by: req.session?.user?.email || 'anonymous',
        original_title: title
      }
    };
    
    console.log('📄 Creating file as turn:', filename);
    
    // Use TurnProcessor to create turn with embeddings
    const createdTurn = await turnProcessor.createTurn(turnData);
    
    res.json({
      id: createdTurn.id,
      turn_id: createdTurn.id, // For backward compatibility
      filename: filename,
      size: content.length,
      chunks: createdTurn.embedding?.chunks_created || 0,
      uploaded_at: createdTurn.created_at,
      content: content,
      source_type: 'file_upload',
      embedding_info: {
        has_embedding: createdTurn.embedding?.has_embedding || false,
        chunks_created: createdTurn.embedding?.chunks_created || 0,
        model: createdTurn.embedding?.model || 'none'
      }
    });
    
  } catch (error) {
    console.error('Text file creation error:', error);
    res.status(500).json({ error: error.message || 'Failed to create text file' });
  }
}

// Upload file handler - now creates turns directly
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
    const user_id = req.session?.user?.user_id;
    
    if (!client_id) {
      return res.status(401).json({ error: 'Authentication required - no client selected' });
    }
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Could not extract readable text from file' });
    }
    
    // Create TurnProcessor instance
    const turnProcessor = new TurnProcessor();
    
    // Create turn data for the uploaded file
    const turnData = {
      client_id: client_id,
      user_id: user_id,
      content: content,
      source_type: 'file_upload',
      meeting_id: null, // File uploads are not associated with meetings
      metadata: {
        filename: originalname,
        content_type: mimetype || 'text/plain',
        file_size: size,
        source: 'upload',
        uploaded_by: req.session?.user?.email || 'anonymous',
        original_buffer_size: size,
        ...extractedMetadata
      }
    };
    
    console.log('📄 Creating uploaded file as turn:', originalname, `(${size} bytes)`);
    
    // Use TurnProcessor to create turn with embeddings
    const createdTurn = await turnProcessor.createTurn(turnData);
    
    res.json({
      id: createdTurn.id,
      turn_id: createdTurn.id, // For backward compatibility
      filename: originalname,
      size: size,
      content_length: content.length,
      chunks: createdTurn.embedding?.chunks_created || 0,
      uploaded_at: createdTurn.created_at,
      source_type: 'file_upload',
      embedding_info: {
        has_embedding: createdTurn.embedding?.has_embedding || false,
        chunks_created: createdTurn.embedding?.chunks_created || 0,
        model: createdTurn.embedding?.model || 'none',
        total_characters: createdTurn.embedding?.total_characters || content.length
      }
    });
    
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload file' });
  }
}
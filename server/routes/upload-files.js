import express from 'express';
import multer from 'multer';
import { createTextFile, uploadFile } from '../lib/upload-handlers.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    // Only allow .txt and .md files
    const allowedTypes = ['.txt', '.md'];
    const ext = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only .txt and .md files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Create text file endpoint
router.post('/create-text', createTextFile);

// Upload file endpoint  
router.post('/upload', upload.single('file'), uploadFile);

// Get uploaded files
router.get('/files', async (req, res) => {
  try {
    const client_id = req.session?.user?.client_id;
    if (!client_id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const result = await req.pool.query(`
      SELECT 
        f.id, 
        f.filename, 
        f.file_size as size, 
        f.created_at as uploaded_at,
        f.metadata,
        f.source_type,
        COUNT(c.id) as chunk_count
      FROM context.files f
      LEFT JOIN context.chunks c ON c.file_id = f.id
      WHERE f.source_type IN ('upload', 'text-input') 
        AND f.client_id = $1
      GROUP BY f.id
      ORDER BY f.created_at DESC
    `, [client_id]);
    
    // Parse metadata JSON for each file
    const files = result.rows.map(file => ({
      ...file,
      metadata: file.metadata || {}
    }));
    
    res.json(files);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Get file content
router.get('/files/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client_id = req.session?.user?.client_id;
    if (!client_id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get file record
    const fileResult = await req.pool.query(`
      SELECT id, filename, file_size as size, created_at as uploaded_at
      FROM context.files 
      WHERE id = $1 
        AND source_type IN ('upload', 'text-input')
        AND client_id = $2
    `, [id, client_id]);
    
    if (fileResult.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const file = fileResult.rows[0];
    
    // Get all chunks for reconstruction
    const chunksResult = await req.pool.query(`
      SELECT content 
      FROM context.chunks 
      WHERE file_id = $1 
      ORDER BY chunk_index
    `, [id]);
    
    // Reconstruct full content from chunks
    const content = chunksResult.rows.map(row => row.content).join('\n');
    
    res.json({
      ...file,
      content
    });
    
  } catch (error) {
    console.error('Error fetching file content:', error);
    res.status(500).json({ error: 'Failed to fetch file content' });
  }
});

// Delete file
router.delete('/files/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client_id = req.session?.user?.client_id;
    if (!client_id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const client = await req.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Delete chunks first (foreign key constraint)
      await client.query('DELETE FROM context.chunks WHERE file_id = $1', [id]);
      
      // Delete file
      const result = await client.query(`
        DELETE FROM context.files 
        WHERE id = $1 
          AND source_type IN ('upload', 'text-input')
          AND client_id = $2
        RETURNING id
      `, [id, client_id]);
      
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'File not found' });
      }
      
      await client.query('COMMIT');
      res.json({ success: true });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

export default router;
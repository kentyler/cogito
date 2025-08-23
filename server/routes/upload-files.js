import express from 'express';
import multer from 'multer';
import { createTextFile, uploadFile } from '../lib/upload-handlers.js';
import { DatabaseAgent } from '../../lib/database-agent.js';
import { ApiResponses } from '../lib/api-responses.js';

const router = express.Router();

// Initialize DatabaseAgent
const dbAgent = new DatabaseAgent();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    // Only allow .txt, .md and .pdf files
    const allowedTypes = ['.txt', '.md', '.pdf'];
    const ext = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only .txt, .md and .pdf files are allowed'));
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
      return ApiResponses.unauthorized(res, 'Authentication required');
    }
    
    await dbAgent.connect();
    const files = await dbAgent.files.getClientFiles(client_id, ['upload', 'text-input', 'snippet']);
    
    return ApiResponses.success(res, files);
  } catch (error) {
    console.error('Error fetching files:', error);
    return ApiResponses.internalError(res, 'Failed to fetch files');
  } finally {
    await dbAgent.close();
  }
});

// Get file content
router.get('/files/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client_id = req.session?.user?.client_id;
    if (!client_id) {
      return ApiResponses.unauthorized(res, 'Authentication required');
    }
    
    await dbAgent.connect();
    const fileWithContent = await dbAgent.files.getFileWithContent(id, client_id);
    
    if (!fileWithContent) {
      return ApiResponses.notFound(res, 'File not found');
    }
    
    return ApiResponses.success(res, fileWithContent);
    
  } catch (error) {
    console.error('Error fetching file content:', error);
    return ApiResponses.internalError(res, 'Failed to fetch file content');
  } finally {
    await dbAgent.close();
  }
});

// Delete file
router.delete('/files/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client_id = req.session?.user?.client_id;
    if (!client_id) {
      return ApiResponses.unauthorized(res, 'Authentication required');
    }
    
    await dbAgent.connect();
    const deleteResult = await dbAgent.files.deleteFile(id, client_id);
    
    return ApiResponses.success(res, { success: true });
    
  } catch (error) {
    if (error.message.includes('File not found or access denied')) {
      return ApiResponses.notFound(res, 'File not found');
    }
    console.error('Error deleting file:', error);
    return ApiResponses.internalError(res, 'Failed to delete file');
  } finally {
    await dbAgent.close();
  }
});

export default router;
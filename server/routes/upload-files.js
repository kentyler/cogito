import express from 'express';
import multer from 'multer';
import { createTextFile, uploadFile } from '#server/uploads/upload-handlers.js';
import { DatabaseAgent } from '#database/database-agent.js';
import { ApiResponses } from '#server/api/api-responses.js';

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

// REMOVED: File management endpoints
// Files are now just content input - they appear in conversation timeline
// No separate file listing, viewing, or deletion needed
// Content becomes part of conversational history like any other turn

export default router;
/**
 * Upload Handlers V2
 * Updated handlers using DatabaseAgent pattern and supporting thinking tools
 */

import { DatabaseAgent } from '#database/database-agent.js';
import { ApiResponses } from '#server/api/api-responses.js';
import { processFile } from './single-file-processor.js';

// Multiple file upload handler
export async function uploadFiles(req, res) {
  const db = new DatabaseAgent();
  
  try {
    if (!req.files || req.files.length === 0) {
      return ApiResponses.badRequest(res, 'No files uploaded');
    }
    
    const clientId = req.session?.user?.client_id;
    const userId = req.session?.user?.id;
    const meetingId = req.session?.meeting_id;
    
    if (!clientId) {
      return ApiResponses.unauthorized(res, 'Authentication required - no client selected');
    }
    
    await db.connect();
    
    const results = [];
    
    // Process each uploaded file
    for (const file of req.files) {
      try {
        const result = await processFile({ db, file, clientId, userId, meetingId });
        results.push(result);
      } catch (error) {
        console.error(`❌ Error processing file ${file.originalname}:`, error);
        results.push({
          filename: file.originalname,
          error: error.message,
          success: false
        });
      }
    }
    
    return ApiResponses.success(res, {
      files: results,
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });
    
  } catch (error) {
    console.error('❌ Upload handler error:', error);
    return ApiResponses.internalError(res, 'Upload processing failed');
  } finally {
    await db.close();
  }
}


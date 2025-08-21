/**
 * File processing functions for meeting uploads
 * Database fields verified: meeting_id, file_id, created_by_user_id are standard schema fields
 */
import fs from 'fs';

export async function processMeetingFiles(files, {
  fileUploadService,
  db,
  meetingId,
  meetingName,
  meetingUrl,
  clientId,
  userId
}) {
  const uploadedFiles = [];
  
  if (!files || files.length === 0) {
    return uploadedFiles;
  }
  
  console.log(`Processing ${files.length} uploaded files for meeting ${meetingId}`);
  
  for (const file of files) {
    try {
      // Process file using FileUploadService
      const fileUpload = await fileUploadService.processFile(file, {
        clientId: clientId,
        description: `Meeting resource for: ${meetingName || meetingUrl}`,
        tags: ['meeting', 'resource']
      });
      
      // Link file to meeting via junction table
      // Standard database fields: meeting_id, file_id, created_by_user_id
      await db.query(
        `INSERT INTO meetings.meeting_files (meeting_id, file_id, file_source, created_by_user_id, created_at) 
         VALUES ($1, $2, $3, $4, NOW())`,
        [meetingId, fileUpload.id, 'context', userId]
      );
      
      uploadedFiles.push({
        id: fileUpload.id,
        filename: fileUpload.filename,
        size: fileUpload.file_size
      });
      
      console.log(`✅ Processed file: ${fileUpload.filename} (ID: ${fileUpload.id})`);
      
      // Clean up temp file
      fs.unlink(file.path, (err) => {
        if (err) console.error('Error deleting temp file:', err);
      });
      
    } catch (fileError) {
      console.error(`❌ Error processing file ${file.originalname}:`, fileError);
      // Continue processing other files
    }
  }
  
  return uploadedFiles;
}
/**
 * Profile Storage - Handle storing profiles as pseudo-files in meeting context
 */

import { fileUploadService } from '../file-upload.js';

export class ProfileStorage {
  constructor(databaseAgent) {
    this.databaseAgent = databaseAgent;
  }

  /**
   * Store profile as pseudo-file in the meeting context
   * @param {Object} user - User object
   * @param {string} profileContent - Generated profile content
   * @param {string} meetingId - Current meeting ID
   */
  async storeProfileAsFile(user, profileContent, meetingId) {
    const filename = `speaker-profile-${user.user_id}.md`;
    const description = `Auto-generated speaker profile for ${user.alias || user.email}`;
    
    try {
      const fileUpload = await fileUploadService.createFileFromContent(
        profileContent,
        filename,
        'text/markdown',
        description,
        user.user_id // created_by_user_id
      );
      
      // Link file to meeting via meeting_files table
      await this.databaseAgent.query(
        `INSERT INTO meeting_files (id, file_upload_id, created_by_user_id) 
         VALUES ($1, $2, $3)`,
        [meetingId, fileUpload.id, user.user_id]
      );
      
      console.log(`[SpeakerProfile] Stored profile for ${user.alias || user.email} as file: ${filename}, linked to meeting: ${meetingId}`);
      
      return fileUpload;
      
    } catch (error) {
      console.error(`[SpeakerProfile] Failed to store profile file:`, error);
      throw error;
    }
  }

  /**
   * Check if profile already exists for user in meeting
   * @param {number} userId - User ID
   * @param {string} meetingId - Meeting ID
   * @returns {boolean} - True if profile exists
   */
  async profileExistsForMeeting(userId, meetingId) {
    const query = `
      SELECT 1 FROM meeting_files mf
      JOIN client_mgmt.file_uploads fu ON mf.file_upload_id = fu.id
      WHERE mf.id = $1 
        AND fu.filename LIKE $2
        AND fu.created_by_user_id = $3
      LIMIT 1
    `;
    
    const result = await this.databaseAgent.query(query, [
      meetingId, 
      `speaker-profile-${userId}.md`, 
      userId
    ]);
    
    return result.rows.length > 0;
  }

  /**
   * Get profile file for user in meeting
   * @param {number} userId - User ID  
   * @param {string} meetingId - Meeting ID
   * @returns {Object|null} - File upload object if found
   */
  async getProfileForMeeting(userId, meetingId) {
    const query = `
      SELECT fu.* FROM meeting_files mf
      JOIN client_mgmt.file_uploads fu ON mf.file_upload_id = fu.id
      WHERE mf.id = $1 
        AND fu.filename LIKE $2
        AND fu.created_by_user_id = $3
      ORDER BY fu.created_at DESC
      LIMIT 1
    `;
    
    const result = await this.databaseAgent.query(query, [
      meetingId, 
      `speaker-profile-${userId}.md`, 
      userId
    ]);
    
    return result.rows.length > 0 ? result.rows[0] : null;
  }
}
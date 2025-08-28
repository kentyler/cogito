/**
 * Profile Storage - Handle storing profiles as pseudo-files in meeting context
 */

import { fileUploadService } from '#uploads/file-upload.js';

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
      // Available methods: createFileFromContent - verified in FileUploadService
      const fileUpload = await fileUploadService.createFileFromContent(
        profileContent,
        filename,
        'text/markdown',
        description,
        user.user_id // Standard user identifier field
      );
      
      // Link file to meeting via meeting_files table
      // Standard database fields: meeting_id, file_id, created_by_user_id
      await this.databaseAgent.connector.query(
        `INSERT INTO meetings.meeting_files (meeting_id, file_id, file_source, created_by_user_id, created_at) 
         VALUES ($1, $2, $3, $4, NOW())`,
        [meetingId, fileUpload.id, 'context', user.user_id]
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
      SELECT 1 FROM meetings.meeting_files mf
      JOIN context.files f ON mf.file_id = f.id
      WHERE mf.meeting_id = $1 
        AND f.filename LIKE $2
        AND f.client_id = (SELECT client_id FROM client_mgmt.users WHERE user_id = $3)
      LIMIT 1
    `;
    
    const result = await this.databaseAgent.connector.query(query, [
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
      SELECT f.* FROM meetings.meeting_files mf
      JOIN context.files f ON mf.file_id = f.id
      WHERE mf.meeting_id = $1 
        AND f.filename LIKE $2
        AND f.client_id = (SELECT client_id FROM client_mgmt.users WHERE user_id = $3)
      ORDER BY f.created_at DESC
      LIMIT 1
    `;
    
    const result = await this.databaseAgent.connector.query(query, [
      meetingId, 
      `speaker-profile-${userId}.md`, 
      userId
    ]);
    
    return result.rows.length > 0 ? result.rows[0] : null;
  }
}
/**
 * Speaker Profile Agent - Modular version with specialized components
 * 
 * Manages speaker identification and profile generation for meeting bots.
 * Key responsibilities:
 * 1. Map speaker names to user_ids using the user_alias table
 * 2. Generate social context profiles from last 50 turns
 * 3. Store profiles as pseudo-files for meeting context
 * 4. Handle unknown speakers with user interaction dialogs
 */

import { DatabaseAgent } from './database-agent.js';
import { SpeakerIdentifier } from './speaker-profile-agent/speaker-identifier.js';
import { ProfileGenerator } from './speaker-profile-agent/profile-generator.js';
import { ProfileStorage } from './speaker-profile-agent/profile-storage.js';

export class SpeakerProfileAgent {
  constructor(options = {}) {
    // Initialize core dependencies
    this.databaseAgent = options.databaseAgent || new DatabaseAgent();
    this.context = options.context || this.extractContextFromUrl(options.meetingUrl) || 'unknown';
    this.profileTurnLimit = options.profileTurnLimit || 50;
    
    // Initialize specialized modules
    this.identifier = new SpeakerIdentifier(this.databaseAgent, this.context);
    this.generator = new ProfileGenerator(this.databaseAgent, this.profileTurnLimit);
    this.storage = new ProfileStorage(this.databaseAgent);
    
    // Session-level tracking
    this.processedSpeakers = new Set(); // Track speakers we've generated profiles for
  }

  /**
   * Extract platform context from meeting URL
   * @param {string} meetingUrl - Meeting URL
   * @returns {string} - Platform context (e.g., 'meet.google.com', 'zoom.us')
   */
  extractContextFromUrl(meetingUrl) {
    if (!meetingUrl) return null;
    
    try {
      const url = new URL(meetingUrl);
      return url.hostname.toLowerCase();
    } catch (error) {
      console.warn(`[SpeakerProfile] Invalid meeting URL: ${meetingUrl}`);
      return null;
    }
  }

  /**
   * Register handler for unknown speakers
   * Handler will be called with (speakerName, context) and should return user_id or null
   */
  onUnknownSpeaker(handler) {
    this.identifier.onUnknownSpeaker(handler);
  }

  /**
   * Process a speaker from transcript - main entry point
   * @param {string} speakerName - Name as it appears in transcript
   * @param {string} meetingId - Current meeting ID
   * @returns {number|null} - user_id if identified, null if unknown
   */
  async processSpeaker(speakerName, meetingId) {
    console.log(`[SpeakerProfile] Processing speaker: ${speakerName} in context: ${this.context}`);

    // Try to identify the speaker
    const user = await this.identifier.identifySpeaker(speakerName);
    
    if (user) {
      // DISABLED: Profile generation for now - just return user_id
      // const speakerKey = `${this.context}:${speakerName}`;
      // if (!this.processedSpeakers.has(speakerKey)) {
      //   await this.generateAndStoreProfile(user, meetingId);
      //   this.processedSpeakers.add(speakerKey);
      // }
      
      return user.user_id;
    } else {
      // Handle unknown speaker
      console.log(`[SpeakerProfile] Unknown speaker: ${speakerName}`);
      const userId = await this.identifier.handleUnknownSpeaker(speakerName);
      
      if (userId) {
        // DISABLED: Profile generation for newly mapped speaker
        // const newUser = await this.identifier.getUserInfo(userId);
        // if (newUser) {
        //   await this.generateAndStoreProfile(newUser, meetingId);
        //   this.processedSpeakers.add(`${this.context}:${speakerName}`);
        // }
      }
      
      return userId;
    }
  }

  /**
   * Generate and store profile for a user
   * @param {Object} user - User object
   * @param {string} meetingId - Meeting ID
   */
  async generateAndStoreProfile(user, meetingId) {
    // Check if profile already exists for this meeting
    const profileExists = await this.storage.profileExistsForMeeting(user.user_id, meetingId);
    if (profileExists) {
      console.log(`[SpeakerProfile] Profile already exists for user ${user.user_id} in meeting ${meetingId}`);
      return;
    }

    // Generate profile content
    const profileContent = await this.generator.generateProfile(user);
    if (!profileContent) {
      console.log(`[SpeakerProfile] Could not generate profile for user ${user.user_id} - no conversation history`);
      return;
    }

    // Store as pseudo-file
    await this.storage.storeProfileAsFile(user, profileContent, meetingId);
  }

  /**
   * Lookup user info for a speaker (without processing)
   * @param {string} speakerName - Name from transcript  
   * @returns {Object|null} - User object if found
   */
  async lookupUser(speakerName) {
    return await this.identifier.identifySpeaker(speakerName);
  }

  /**
   * Create alias mapping for a speaker
   * @param {number} userId - User ID
   * @param {string} speakerName - Speaker name
   * @param {Object} metadata - Additional metadata
   */
  async createAlias(userId, speakerName, metadata = {}) {
    return await this.identifier.createAlias(userId, speakerName, metadata);
  }

  /**
   * Get statistics about speaker processing
   */
  getStats() {
    return {
      cachedSpeakers: this.identifier.getCachedSpeakersCount(),
      processedSpeakers: this.processedSpeakers.size,
      context: this.context,
      profileTurnLimit: this.profileTurnLimit,
      knownSpeakers: this.identifier.getKnownSpeakers()
    };
  }

  /**
   * Clear session caches (useful for testing or memory management)
   */
  clearCaches() {
    this.identifier.clearCaches();
    this.processedSpeakers.clear();
    console.log(`[SpeakerProfile] Cleared all session caches`);
  }

  /**
   * Convenience method to get access to specialized modules
   */
  get modules() {
    return {
      identifier: this.identifier,
      generator: this.generator,
      storage: this.storage
    };
  }
}

// Export singleton instance for backward compatibility
export const speakerProfileAgent = new SpeakerProfileAgent();
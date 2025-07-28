/**
 * Speaker Identifier - Handle speaker identification and user mapping
 */

export class SpeakerIdentifier {
  constructor(databaseAgent, context) {
    this.databaseAgent = databaseAgent;
    this.context = context;
    this.sessionSpeakerCache = new Map(); // speakerName → user_id
    this.unknownSpeakerHandlers = []; // Callbacks for handling unknown speakers
  }

  /**
   * Register handler for unknown speakers
   * Handler will be called with (speakerName, context) and should return user_id or null
   */
  onUnknownSpeaker(handler) {
    this.unknownSpeakerHandlers.push(handler);
  }

  /**
   * Identify speaker using user_alias table
   * @param {string} speakerName - Name from transcript
   * @returns {Object|null} - User object if found
   */
  async identifySpeaker(speakerName) {
    // Check session cache first for performance
    if (this.sessionSpeakerCache.has(speakerName)) {
      const userId = this.sessionSpeakerCache.get(speakerName);
      return await this.getUserInfo(userId);
    }

    const query = `
      SELECT u.id as user_id, u.email, u.metadata, ua.alias, ua.context
      FROM client_mgmt.user_alias ua
      JOIN client_mgmt.users u ON ua.user_id = u.id
      WHERE ua.context = $1 AND ua.alias = $2
    `;
    
    const result = await this.databaseAgent.query(query, [this.context, speakerName]);
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log(`[SpeakerProfile] Identified speaker ${speakerName} as user_id: ${user.user_id}`);
      
      // Cache the mapping for future lookups
      this.sessionSpeakerCache.set(speakerName, user.user_id);
      return user;
    }
    
    return null;
  }

  /**
   * Get user info by user_id
   * @param {number} userId - User ID
   * @returns {Object|null} - User object if found
   */
  async getUserInfo(userId) {
    const query = `
      SELECT u.id as user_id, u.email, u.metadata,
             ua.alias, ua.context
      FROM client_mgmt.users u
      LEFT JOIN client_mgmt.user_alias ua ON u.id = ua.user_id AND ua.context = $1
      WHERE u.id = $2
    `;
    
    const result = await this.databaseAgent.query(query, [this.context, userId]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Handle unknown speaker - call registered handlers or log for manual resolution
   */
  async handleUnknownSpeaker(speakerName) {
    console.log(`[SpeakerProfile] Handling unknown speaker: ${speakerName}`);
    
    // Try registered handlers
    for (const handler of this.unknownSpeakerHandlers) {
      try {
        const userId = await handler(speakerName, this.context);
        if (userId) {
          // Create alias mapping
          await this.createAlias(userId, speakerName);
          
          // Cache the new mapping
          this.sessionSpeakerCache.set(speakerName, userId);
          return userId;
        }
      } catch (error) {
        console.error(`[SpeakerProfile] Handler error for ${speakerName}:`, error);
      }
    }
    
    // TODO: Could trigger UI dialog or webhook for manual resolution
    console.log(`[SpeakerProfile] No handler resolved speaker: ${speakerName}. Manual intervention needed.`);
    return null;
  }

  /**
   * Create alias mapping for a speaker
   */
  async createAlias(userId, speakerName, metadata = {}) {
    const query = `
      INSERT INTO client_mgmt.user_alias (user_id, context, alias, metadata, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (context, alias) DO NOTHING
      RETURNING alias_id
    `;
    
    const result = await this.databaseAgent.query(query, [
      userId, 
      this.context, 
      speakerName, 
      JSON.stringify({...metadata, source: 'speaker_profile_agent'})
    ]);
    
    if (result.rows.length > 0) {
      console.log(`[SpeakerProfile] Created alias mapping: ${speakerName} → user_id ${userId}`);
    }
  }

  /**
   * Clear session caches (useful for testing or memory management)
   */
  clearCaches() {
    this.sessionSpeakerCache.clear();
    console.log(`[SpeakerProfile] Cleared speaker identifier caches`);
  }

  /**
   * Get cached speakers count
   */
  getCachedSpeakersCount() {
    return this.sessionSpeakerCache.size;
  }

  /**
   * Get list of known speakers
   */
  getKnownSpeakers() {
    return Array.from(this.sessionSpeakerCache.keys());
  }
}
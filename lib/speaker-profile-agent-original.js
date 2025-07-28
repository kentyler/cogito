/**
 * Speaker Profile Agent
 * 
 * Manages speaker identification and profile generation for meeting bots.
 * Key responsibilities:
 * 1. Map speaker names to user_ids using the user_alias table
 * 2. Generate social context profiles from last 50 turns
 * 3. Store profiles as pseudo-files for meeting context
 * 4. Handle unknown speakers with user interaction dialogs
 */

import { DatabaseAgent } from './database-agent.js';
import { fileUploadService } from './file-upload.js';

export class SpeakerProfileAgent {
  constructor(options = {}) {
    this.databaseAgent = options.databaseAgent || new DatabaseAgent();
    this.context = options.context || this.extractContextFromUrl(options.meetingUrl) || 'unknown';
    this.profileTurnLimit = options.profileTurnLimit || 50;
    this.unknownSpeakerHandlers = []; // Callbacks for handling unknown speakers
    
    // Session-level caches for performance
    this.sessionSpeakerCache = new Map(); // speakerName → user_id
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
    this.unknownSpeakerHandlers.push(handler);
  }

  /**
   * Process a speaker from transcript - main entry point
   * @param {string} speakerName - Name as it appears in transcript
   * @param {string} blockId - Current meeting block ID
   * @returns {number|null} - user_id if identified, null if unknown
   */
  async processSpeaker(speakerName, blockId) {
    // Check session cache first for performance
    if (this.sessionSpeakerCache.has(speakerName)) {
      const userId = this.sessionSpeakerCache.get(speakerName);
      
      // Check if we need to generate profile for this speaker
      const speakerKey = `${this.context}:${speakerName}`;
      if (!this.processedSpeakers.has(speakerKey)) {
        const user = await this.getUserInfo(userId);
        if (user) {
          await this.generateProfile(user, blockId);
          this.processedSpeakers.add(speakerKey);
        }
      }
      
      return userId;
    }

    console.log(`[SpeakerProfile] Processing new speaker: ${speakerName} in context: ${this.context}`);

    // Try to identify the speaker from database
    const user = await this.identifySpeaker(speakerName);
    
    if (user) {
      // Cache the mapping for future lookups
      this.sessionSpeakerCache.set(speakerName, user.user_id);
      
      // Generate and store profile
      await this.generateProfile(user, blockId);
      this.processedSpeakers.add(`${this.context}:${speakerName}`);
      
      return user.user_id;
    } else {
      // Handle unknown speaker
      console.log(`[SpeakerProfile] Unknown speaker: ${speakerName}`);
      const userId = await this.handleUnknownSpeaker(speakerName);
      
      if (userId) {
        // Cache the new mapping
        this.sessionSpeakerCache.set(speakerName, userId);
        
        // Generate profile for newly mapped speaker
        const newUser = await this.getUserInfo(userId);
        if (newUser) {
          await this.generateProfile(newUser, blockId);
          this.processedSpeakers.add(`${this.context}:${speakerName}`);
        }
      }
      
      return userId;
    }
  }

  /**
   * Identify speaker using user_alias table
   * @param {string} speakerName - Name from transcript
   * @returns {Object|null} - User object if found
   */
  async identifySpeaker(speakerName) {
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
   * Lookup user info for a speaker (without processing)
   * @param {string} speakerName - Name from transcript  
   * @returns {Object|null} - User object if found
   */
  async lookupUser(speakerName) {
    // Check cache first
    if (this.sessionSpeakerCache.has(speakerName)) {
      const userId = this.sessionSpeakerCache.get(speakerName);
      return await this.getUserInfo(userId);
    }
    
    // Fall back to database lookup
    return await this.identifySpeaker(speakerName);
  }

  /**
   * Generate social context profile from user's last N turns
   * @param {Object} user - User object with user_id
   * @param {string} meetingId - Current meeting ID
   */
  async generateProfile(user, meetingId) {
    console.log(`[SpeakerProfile] Generating profile for user_id: ${user.user_id}`);

    // Get user's last N turns across all conversations
    const turnsQuery = `
      SELECT t.content, t.timestamp, t.metadata, m.name as meeting_name
      FROM conversation.turns t
      LEFT JOIN conversation.meetings m ON t.meeting_id = m.meeting_id
      WHERE t.user_id = $1 
        AND t.content IS NOT NULL 
        AND LENGTH(t.content) > 10
      ORDER BY t.timestamp DESC
      LIMIT $2
    `;
    
    const turnsResult = await this.databaseAgent.query(turnsQuery, [user.user_id, this.profileTurnLimit]);
    
    if (turnsResult.rows.length === 0) {
      console.log(`[SpeakerProfile] No conversation history found for user_id: ${user.user_id}`);
      return;
    }

    // Generate profile content
    const profile = this.buildSocialProfile(user, turnsResult.rows);
    
    // Store as pseudo-file
    await this.storeProfileAsFile(user, profile, meetingId);
  }

  /**
   * Build social context profile from conversation turns
   * @param {Object} user - User object
   * @param {Array} turns - Recent conversation turns
   * @returns {string} - Profile content
   */
  buildSocialProfile(user, turns) {
    const alias = turns[0]?.metadata?.speaker_label || user.alias || user.email;
    const turnCount = turns.length;
    const dateRange = turnCount > 0 ? 
      `${new Date(turns[turnCount-1].timestamp).toDateString()} to ${new Date(turns[0].timestamp).toDateString()}` :
      'No recent activity';

    // Extract communication patterns
    const avgLength = Math.round(turns.reduce((sum, t) => sum + t.content.length, 0) / turnCount);
    const recentTopics = this.extractTopics(turns);
    const communicationStyle = this.analyzeCommunicationStyle(turns);

    const profile = `# Speaker Profile: ${alias}

## Basic Information
- **User ID**: ${user.user_id}
- **Email**: ${user.email}
- **Recent Activity**: ${turnCount} turns from ${dateRange}

## Communication Style
${communicationStyle}

## Recent Topics & Context
${recentTopics}

## Recent Conversation Excerpts
${turns.slice(0, 10).map((turn, i) => 
  `**${new Date(turn.timestamp).toLocaleDateString()}** in *${turn.meeting_name || 'Unknown Meeting'}*:\n"${turn.content.substring(0, 200)}${turn.content.length > 200 ? '...' : ''}"\n`
).join('\n')}

---
*Generated for meeting context - helps bot understand shared history and communication preferences*
*Profile based on last ${turnCount} conversation turns*
`;

    return profile;
  }

  /**
   * Extract key topics from recent turns
   */
  extractTopics(turns) {
    // Simple keyword extraction - could be enhanced with NLP
    const allText = turns.map(t => t.content).join(' ').toLowerCase();
    
    // Count common non-trivial words
    const words = allText.match(/\b\w{4,}\b/g) || [];
    const wordCounts = {};
    words.forEach(word => {
      if (!this.isStopWord(word)) {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    });
    
    // Get top topics
    const topWords = Object.entries(wordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([word, count]) => `${word} (${count}x)`)
      .join(', ');
    
    return topWords || 'No clear patterns identified';
  }

  /**
   * Analyze communication style from turns
   */
  analyzeCommunicationStyle(turns) {
    const avgLength = turns.reduce((sum, t) => sum + t.content.length, 0) / turns.length;
    const hasQuestions = turns.filter(t => t.content.includes('?')).length;
    const hasLongResponses = turns.filter(t => t.content.length > 200).length;
    
    const style = [];
    
    if (avgLength > 150) style.push('Detailed communicator');
    else if (avgLength < 50) style.push('Concise communicator');
    
    if (hasQuestions > turns.length * 0.3) style.push('Asks many questions');
    if (hasLongResponses > turns.length * 0.2) style.push('Provides detailed explanations');
    
    return style.length > 0 ? `- ${style.join('\n- ')}` : '- Communication style not yet determined';
  }

  /**
   * Basic stop word filter
   */
  isStopWord(word) {
    const stopWords = new Set(['that', 'this', 'with', 'have', 'will', 'from', 'they', 'know', 'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come', 'here', 'just', 'like', 'long', 'make', 'many', 'over', 'such', 'take', 'than', 'them', 'well', 'were']);
    return stopWords.has(word);
  }

  /**
   * Store profile as pseudo-file in the meeting context
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
        `INSERT INTO conversation.meeting_files (meeting_id, file_upload_id, created_by_user_id) 
         VALUES ($1, $2, $3)`,
        [meetingId, fileUpload.id, user.user_id]
      );
      
      console.log(`[SpeakerProfile] Stored profile for ${user.alias || user.email} as file: ${filename}, linked to meeting: ${meetingId}`);
      
    } catch (error) {
      console.error(`[SpeakerProfile] Failed to store profile file:`, error);
    }
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
   * Get statistics about speaker processing
   */
  getStats() {
    return {
      cachedSpeakers: this.sessionSpeakerCache.size,
      processedSpeakers: this.processedSpeakers.size,
      context: this.context,
      profileTurnLimit: this.profileTurnLimit,
      knownSpeakers: Array.from(this.sessionSpeakerCache.keys())
    };
  }

  /**
   * Clear session caches (useful for testing or memory management)
   */
  clearCaches() {
    this.sessionSpeakerCache.clear();
    this.processedSpeakers.clear();
    console.log(`[SpeakerProfile] Cleared session caches`);
  }
}

// Example usage:
/*
const profileAgent = new SpeakerProfileAgent({ context: 'google_meet' });

// Register handler for unknown speakers
profileAgent.onUnknownSpeaker(async (speakerName, context) => {
  // Could trigger UI dialog or API call for user selection
  console.log(`Please map speaker "${speakerName}" to a user_id`);
  return null; // Return user_id if mapped
});

// Process speaker from transcript
await profileAgent.processSpeaker('Kenneth Tyler', 'block-123');
*/
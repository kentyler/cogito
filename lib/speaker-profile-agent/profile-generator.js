/**
 * Profile Generator - Generate social context profiles from conversation history
 */

export class ProfileGenerator {
  constructor(databaseAgent, profileTurnLimit = 50) {
    this.databaseAgent = databaseAgent;
    this.profileTurnLimit = profileTurnLimit;
  }

  /**
   * Generate social context profile from user's last N turns
   * @param {Object} user - User object with user_id
   * @returns {string} - Profile content
   */
  async generateProfile(user) {
    console.log(`[SpeakerProfile] Generating profile for user_id: ${user.user_id}`);

    // Get user's last N turns across all conversations
    const turnsQuery = `
      SELECT t.content, t.timestamp, t.metadata, m.name as meeting_name
      FROM meetings.turns t
      LEFT JOIN meetings m ON t.id = m.id
      WHERE t.user_id = $1 
        AND t.content IS NOT NULL 
        AND LENGTH(t.content) > 10
      ORDER BY t.timestamp DESC
      LIMIT $2
    `;
    
    const turnsResult = await this.databaseAgent.connector.query(turnsQuery, [user.user_id, this.profileTurnLimit]);
    
    if (turnsResult.rows.length === 0) {
      console.log(`[SpeakerProfile] No conversation history found for user_id: ${user.user_id}`);
      return null;
    }

    // Generate profile content
    return this.buildSocialProfile(user, turnsResult.rows);
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
  `**${new Date(turn.timestamp).toLocaleDateString()}** in *${turn.meeting_name || 'Unknown Meeting'}*:
"${turn.content.substring(0, 200)}${turn.content.length > 200 ? '...' : ''}"\n`
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
}
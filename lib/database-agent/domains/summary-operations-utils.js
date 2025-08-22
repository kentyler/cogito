/**
 * Summary Operations Utilities - Helper functions for summary operations
 * Available methods: validateDate, getUserContext, buildTurnsQuery, formatTurnsForAI, generateAISummary
 */

export class SummaryUtils {
  /**
   * Validate date format (YYYY-MM-DD)
   */
  static validateDate(date) {
    return /^\d{4}-\d{2}-\d{2}$/.test(date);
  }

  /**
   * Extract user context from request or use defaults
   */
  static getUserContext(req) {
    let user_id;
    let client_id = null;
    let client_name = 'your organization';
    
    if (req && req.session && req.session.user) {
      user_id = req.session.user.user_id;
      client_id = req.session.user.client_id;
      client_name = req.session.user.client_name || client_name;
    } else if (process.env.NODE_ENV !== 'production') {
      user_id = 1;
    } else {
      throw new Error('Authentication required');
    }
    
    return { user_id, client_id, client_name };
  }

  /**
   * Build query to fetch turns for a date range
   */
  static buildTurnsQuery(startDate, endDate, client_id) {
    let turnsQuery = `
      SELECT t.id, t.content, t.source_type, t.created_at, t.metadata,
             u.email
      FROM meetings.turns t
      LEFT JOIN client_mgmt.users u ON t.user_id = u.id
      WHERE t.created_at >= $1::timestamp 
        AND t.created_at <= $2::timestamp
    `;
    
    let queryParams = [startDate, endDate];
    
    if (client_id) {
      turnsQuery += ` AND t.client_id = $3`;
      queryParams.push(client_id);
    }
    
    turnsQuery += ` ORDER BY t.created_at ASC`;
    
    return { turnsQuery, queryParams };
  }

  /**
   * Format turns data for AI processing
   */
  static formatTurnsForAI(turns) {
    return turns.map(turn => {
      const speaker = turn.source_type.includes('user') 
        ? `${turn.email || 'User'}` 
        : 'Assistant';
      const time = new Date(turn.created_at).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      return `[${time}] ${speaker}: ${turn.content}`;
    }).join('\n');
  }

  /**
   * Generate AI summary using Anthropic API
   */
  static async generateAISummary(anthropic, prompt, maxTokens = 300) {
    try {
      const message = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: maxTokens,
        temperature: 0.3,
        messages: [{ role: "user", content: prompt }]
      });
      
      return message.content[0].text;
    } catch (error) {
      console.error('AI summary generation failed:', error);
      throw new Error(`Failed to generate summary: ${error.message}`);
    }
  }
}
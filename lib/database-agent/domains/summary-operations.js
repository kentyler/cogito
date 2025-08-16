/**
 * Summary Operations - Handle summary generation and management
 */

export class SummaryOperations {
  constructor(connector) {
    this.connector = connector;
  }

  /**
   * Validate date format (YYYY-MM-DD)
   */
  validateDate(date) {
    return /^\d{4}-\d{2}-\d{2}$/.test(date);
  }

  /**
   * Extract user context from request or use defaults
   */
  getUserContext(req) {
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
  buildTurnsQuery(startDate, endDate, client_id) {
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
  formatTurnsForAI(turns) {
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
  async generateAISummary(anthropic, prompt, maxTokens = 300) {
    if (!anthropic) {
      return 'AI summary generation not available - Claude API not configured.';
    }
    
    try {
      const message = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }]
      });
      
      return message.content[0].text;
    } catch (error) {
      console.error('LLM Error generating summary:', error);
      return `Error generating summary: ${error.message}`;
    }
  }

  /**
   * Get turns for a specific date range
   */
  async getTurnsForDateRange(startDate, endDate, client_id) {
    const { turnsQuery, queryParams } = this.buildTurnsQuery(startDate, endDate, client_id);
    
    try {
      const result = await this.connector.query(turnsQuery, queryParams);
      return result.rows;
    } catch (error) {
      console.error('❌ Error fetching turns for date range:', error);
      throw error;
    }
  }

  /**
   * Generate monthly summaries for a given year/month
   */
  async generateMonthlySummaries(year, month, client_id, client_name, anthropic) {
    if (year < 2020 || year > new Date().getFullYear() + 1) {
      throw new Error('Invalid year');
    }
    if (month < 0 || month > 11) {
      throw new Error('Invalid month (0-11)');
    }

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const summaries = {};
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const startDate = `${date} 00:00:00`;
      const endDate = `${date} 23:59:59`;
      
      try {
        const turns = await this.getTurnsForDateRange(startDate, endDate, client_id);
        
        if (turns.length > 0) {
          const formattedTurns = this.formatTurnsForAI(turns);
          
          const prompt = `Please create a concise daily summary of the following conversations from ${client_name} on ${date}.

Focus on:
- Key topics discussed (2-3 main themes)
- Important questions asked
- Any decisions or insights
- Brief mention of participant interactions

Keep it concise (2-3 sentences maximum):

Conversations:
${formattedTurns}`;

          const summary = await this.generateAISummary(anthropic, prompt, 300);
          
          summaries[date] = {
            summary,
            turnCount: turns.length,
            userTurns: turns.filter(t => t.source_type.includes('user')).length,
            assistantTurns: turns.filter(t => t.source_type.includes('llm')).length
          };
        }
      } catch (dayError) {
        console.error(`Error processing day ${date}:`, dayError);
      }
    }
    
    return {
      summaries,
      year,
      month,
      monthName: new Date(year, month).toLocaleDateString('en-US', { month: 'long' })
    };
  }

  /**
   * Generate daily summary for a specific date
   */
  async generateDailySummary(date, client_id, client_name, anthropic) {
    if (!this.validateDate(date)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }

    const startDate = `${date} 00:00:00`;
    const endDate = `${date} 23:59:59`;
    
    try {
      const turns = await this.getTurnsForDateRange(startDate, endDate, client_id);
      
      if (turns.length === 0) {
        return {
          date,
          summary: 'No conversations found for this date.',
          turnCount: 0,
          userTurns: 0,
          assistantTurns: 0
        };
      }

      const formattedTurns = this.formatTurnsForAI(turns);
      
      const prompt = `Please create a detailed daily summary of the following conversations from ${client_name} on ${date}.

Include:
- Overview of main topics and themes discussed
- Key questions asked and insights discovered
- Important decisions or action items
- Notable participant interactions
- Overall tone and engagement level

Conversations:
${formattedTurns}`;

      const summary = await this.generateAISummary(anthropic, prompt, 500);
      
      return {
        date,
        summary,
        turnCount: turns.length,
        userTurns: turns.filter(t => t.source_type.includes('user')).length,
        assistantTurns: turns.filter(t => t.source_type.includes('llm')).length
      };
      
    } catch (error) {
      console.error(`❌ Error generating daily summary for ${date}:`, error);
      throw error;
    }
  }

  /**
   * Generate yearly summaries - one summary for each month of the year
   */
  async generateYearlySummaries(year, client_id, client_name, anthropic) {
    if (year < 2020 || year > new Date().getFullYear() + 1) {
      throw new Error('Invalid year');
    }

    const summaries = {};
    
    for (let month = 0; month < 12; month++) {
      const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
      const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long' });
      
      // Get first and last day of the month
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      const startDate = `${firstDay.getFullYear()}-${String(firstDay.getMonth() + 1).padStart(2, '0')}-${String(firstDay.getDate()).padStart(2, '0')} 00:00:00`;
      const endDate = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')} 23:59:59`;
      
      try {
        const turns = await this.getTurnsForDateRange(startDate, endDate, client_id);
        
        if (turns.length > 0) {
          const formattedTurns = this.formatTurnsForAI(turns);
          
          const prompt = `Please create a comprehensive monthly summary of the following conversations from ${client_name} during ${monthName} ${year}.

Focus on:
- Major themes and topics discussed throughout the month
- Key insights, discoveries, and decisions made
- Notable patterns in user interactions and questions
- Progress on ongoing projects or discussions
- Any significant changes or developments

Keep it informative but concise (3-4 sentences maximum):

Conversations:
${formattedTurns}`;

          const summary = await this.generateAISummary(anthropic, prompt, 400);
          
          summaries[monthKey] = {
            summary,
            turnCount: turns.length,
            userTurns: turns.filter(t => t.source_type.includes('user')).length,
            assistantTurns: turns.filter(t => t.source_type.includes('llm')).length,
            month: monthName,
            year: year
          };
        }
      } catch (monthError) {
        console.error(`Error processing month ${monthKey}:`, monthError);
      }
    }
    
    return {
      summaries,
      year,
      yearName: year.toString()
    };
  }
}
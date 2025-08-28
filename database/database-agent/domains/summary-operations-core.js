/**
 * Summary Operations Core - Main summary generation methods
 */

import { SummaryUtils } from './summary-operations-utils.js';

export class SummaryCore {
  constructor(connector) {
    this.connector = connector;
  }

  /**
   * Get turns for a specific date range
   */
  async getTurnsForDateRange(startDate, endDate, client_id) {
    const { turnsQuery, queryParams } = SummaryUtils.buildTurnsQuery(startDate, endDate, client_id);
    
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
      
      try {
        const startDate = `${date} 00:00:00`;
        const endDate = `${date} 23:59:59`;
        
        const turns = await this.getTurnsForDateRange(startDate, endDate, client_id);
        
        if (turns.length > 0) {
          const formattedTurns = SummaryUtils.formatTurnsForAI(turns);
          
          const prompt = `Please create a brief daily summary of conversations from ${client_name} on ${date}.

Include:
- Key topics discussed (2-3 main themes)
- Important questions asked
- Any decisions or insights
- Brief mention of participant interactions

Keep it concise (2-3 sentences maximum):

Conversations:
${formattedTurns}`;

          const summary = await SummaryUtils.generateAISummary(anthropic, prompt, 300);
          
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
    if (!SummaryUtils.validateDate(date)) {
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

      const formattedTurns = SummaryUtils.formatTurnsForAI(turns);
      
      const prompt = `Please create a detailed daily summary of the following conversations from ${client_name} on ${date}.

Include:
- Overview of main topics and themes discussed
- Key questions asked and insights discovered
- Important decisions or action items
- Notable participant interactions
- Overall tone and engagement level

Conversations:
${formattedTurns}`;

      const summary = await SummaryUtils.generateAISummary(anthropic, prompt, 500);
      
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
      
      try {
        const monthSummaries = await this.generateMonthlySummaries(year, month, client_id, client_name, anthropic);
        
        if (Object.keys(monthSummaries.summaries).length > 0) {
          const dailySummariesText = Object.entries(monthSummaries.summaries)
            .map(([date, data]) => `${date}: ${data.summary}`)
            .join('\n');
          
          const prompt = `Please create a monthly summary for ${monthName} ${year} from ${client_name} based on these daily summaries.

Include:
- Major themes and trends for the month
- Key accomplishments or milestones
- Important decisions made
- Overall progression of conversations
- Participant engagement patterns

Daily summaries:
${dailySummariesText}`;

          const monthSummary = await SummaryUtils.generateAISummary(anthropic, prompt, 600);
          
          summaries[monthKey] = {
            summary: monthSummary,
            month: monthName,
            year,
            dailySummaries: monthSummaries.summaries,
            totalTurns: Object.values(monthSummaries.summaries).reduce((sum, day) => sum + day.turnCount, 0)
          };
        }
      } catch (monthError) {
        console.error(`Error processing month ${monthName} ${year}:`, monthError);
      }
    }
    
    return {
      summaries,
      year
    };
  }
}
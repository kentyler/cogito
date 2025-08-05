/**
 * Search Analyzer - Handle search operations and user analytics
 */

export class SearchAnalyzer {
  constructor(connector) {
    this.connector = connector;
  }

  /**
   * Search through transcripts using full-text search
   */
  async searchTranscripts(searchTerm, options = {}) {
    const {
      clientId,
      meetingId,
      sourceType,
      limit = 20,
      offset = 0,
      exactMatch = false
    } = options;

    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    // Full-text search condition
    if (exactMatch) {
      whereConditions.push(`t.content ILIKE $${paramIndex++}`);
      params.push(`%${searchTerm}%`);
    } else {
      // Use PostgreSQL full-text search
      whereConditions.push(`to_tsvector('english', t.content) @@ plainto_tsquery('english', $${paramIndex++})`);
      params.push(searchTerm);
    }

    // Additional filters
    if (clientId) {
      whereConditions.push(`m.client_id = $${paramIndex++}`);
      params.push(clientId);
    }
    
    if (meetingId) {
      whereConditions.push(`m.id = $${paramIndex++}`);
      params.push(meetingId);
    }
    
    if (sourceType) {
      whereConditions.push(`t.source_type = $${paramIndex++}`);
      params.push(sourceType);
    }

    const query = `
      SELECT 
        m.id,
        m.name as meeting_name,
        m.meeting_type,
        t.id,
        t.content,
        t.source_type,
        t.timestamp,
        t.metadata->>'speaker' as speaker,
        ts_rank(to_tsvector('english', t.content), plainto_tsquery('english', $1)) as relevance_score
      FROM meetings m
      JOIN meetings.turns t ON m.id = t.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY relevance_score DESC, t.timestamp DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    params.push(limit, offset);

    try {
      const result = await this.connector.query(query, params);
      
      // Highlight search terms in results
      const highlightedResults = result.rows.map(row => ({
        ...row,
        highlighted_content: this.highlightSearchTerms(row.content, searchTerm)
      }));

      return {
        searchTerm,
        results: highlightedResults,
        total: result.rows.length,
        limit,
        offset
      };
      
    } catch (error) {
      console.error('❌ Error searching transcripts:', error);
      throw error;
    }
  }

  /**
   * Get user statistics and activity summary
   */
  async getUserStats(userId) {
    try {
      const queries = await Promise.all([
        // Basic user info and meeting participation
        this.connector.query(`
          SELECT 
            COUNT(DISTINCT m.id) as meetings_participated,
            COUNT(t.id) as total_turns,
            SUM(LENGTH(t.content)) as total_characters,
            MIN(t.timestamp) as first_activity,
            MAX(t.timestamp) as last_activity
          FROM meetings.turns t
          JOIN meetings m ON t.id = m.id
          WHERE t.metadata->>'user_id' = $1
        `, [userId.toString()]),

        // Meeting types breakdown
        this.connector.query(`
          SELECT 
            m.meeting_type,
            COUNT(DISTINCT m.id) as meeting_count,
            COUNT(t.id) as turn_count
          FROM meetings.turns t
          JOIN meetings m ON t.id = m.id
          WHERE t.metadata->>'user_id' = $1
          GROUP BY m.meeting_type
          ORDER BY meeting_count DESC
        `, [userId.toString()]),

        // Activity over time (last 30 days)
        this.connector.query(`
          SELECT 
            DATE(t.timestamp) as activity_date,
            COUNT(t.id) as turns_count
          FROM meetings.turns t
          WHERE t.metadata->>'user_id' = $1
            AND t.timestamp >= NOW() - INTERVAL '30 days'
          GROUP BY DATE(t.timestamp)
          ORDER BY activity_date DESC
        `, [userId.toString()])
      ]);

      const [basicStats, meetingTypes, dailyActivity] = queries;

      return {
        userId,
        basic_stats: basicStats.rows[0],
        meeting_types: meetingTypes.rows,
        daily_activity: dailyActivity.rows,
        generated_at: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Error getting user stats:', error);
      throw error;
    }
  }

  /**
   * Highlight search terms in content
   */
  highlightSearchTerms(content, searchTerm) {
    if (!content || !searchTerm) return content;
    
    // Simple highlighting - could be enhanced with proper tokenization
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return content.replace(regex, '<mark>$1</mark>');
  }
}
# Summary System

## Purpose
Comprehensive summary generation system that processes conversation data into structured daily, monthly, and yearly summaries. Provides AI-powered analysis of conversation patterns, key topics, and insights across different time periods.

## Summary System Architecture

### System Overview
The summary system organizes conversation data into time-based summaries with hierarchical analysis:
- **Daily Summaries**: Process individual day's conversations into structured insights
- **Monthly Summaries**: Aggregate daily patterns into monthly trends and themes  
- **Yearly Summaries**: Compile monthly data into annual overviews and long-term patterns

### Data Flow
```
Raw Conversations → Daily Processing → Monthly Aggregation → Yearly Compilation
     ↓                    ↓                  ↓                    ↓
Turn Analysis       Daily Insights    Monthly Patterns     Annual Trends
Topic Extraction    Key Themes        Growth Analysis      Long-term Insights
Pattern Detection   User Engagement   Seasonal Trends      Strategic Overview
```

## Core Summary Components

### `daily-summary/` Subdirectory
Contains the complete daily summary processing system including:
- **Data Collection**: Gathering conversation data for specific dates
- **AI Analysis**: Generating narrative summaries from conversation content
- **Aggregation**: Processing data into monthly and yearly summaries
- **Utilities**: Common functions for date validation, querying, and formatting

```javascript
// Daily summary processing pipeline
export class DailySummarySystem {
  async generateDailySummary(date, clientId) {
    // 1. Validate date format and parameters
    // 2. Extract conversation data for the date
    // 3. Format data for AI analysis
    // 4. Generate AI-powered narrative summary
    // 5. Store summary with metadata and insights
    // 6. Return processed daily summary
  }
  
  async getDailySummaryData(date, clientId) {
    // 1. Retrieve stored daily summary data
    // 2. Separate user and assistant turns
    // 3. Include turn metadata and context
    // 4. Return structured daily data
  }
  
  async compileMonthlyData(year, month, clientId) {
    // 1. Collect all daily summaries for month
    // 2. Identify trending topics and patterns
    // 3. Calculate engagement metrics and growth
    // 4. Generate monthly insights summary
  }
  
  async compileYearlyData(year, clientId) {
    // 1. Aggregate monthly summaries for year
    // 2. Identify annual trends and patterns
    // 3. Calculate yearly totals and metrics
    // 4. Generate comprehensive yearly overview
  }
}
```

## Summary Data Models

### Daily Summary Structure
```javascript
{
  id: number,
  date: string,              // YYYY-MM-DD format
  client_id: number,
  conversation_data: {
    total_turns: number,
    user_turns: [
      {
        turn_id: number,
        content: string,
        source_type: string,
        created_at: Date,
        email: string
      }
    ],
    assistant_turns: [
      {
        turn_id: number,
        content: string,
        source_type: string,
        created_at: Date
      }
    ]
  },
  ai_summary: string,        // Generated narrative summary
  insights: {
    key_topics: [string],
    question_count: number,
    interaction_patterns: object,
    engagement_metrics: object
  },
  metadata: {
    processing_timestamp: Date,
    word_count: number,
    summary_length: number,
    data_quality_score: number
  }
}
```

### Monthly Summary Structure
```javascript
{
  id: number,
  year: number,
  month: number,
  client_id: number,
  aggregated_data: {
    daily_summaries_processed: number,
    total_conversation_turns: number,
    unique_participants: number,
    active_days: number
  },
  trending_topics: [
    {
      topic: string,
      frequency: number,
      growth_rate: number,
      peak_days: [string]
    }
  ],
  patterns: {
    most_active_days: [string],
    peak_hours: [string],
    engagement_trends: object,
    topic_evolution: object
  },
  monthly_insights: string,   // AI-generated monthly summary
  created_at: Date
}
```

### Yearly Summary Structure
```javascript
{
  id: number,
  year: number,
  client_id: number,
  annual_overview: {
    monthly_summaries_count: number,
    total_conversations: number,
    total_participants: number,
    active_months: number,
    growth_metrics: {
      conversation_growth: number,
      participant_growth: number,
      engagement_growth: number
    }
  },
  major_themes: [
    {
      theme: string,
      prominence: number,
      evolution: object,
      key_months: [number]
    }
  ],
  insights: {
    breakthrough_moments: [object],
    seasonal_patterns: object,
    long_term_trends: object,
    strategic_insights: [string]
  },
  yearly_narrative: string,   // Comprehensive yearly summary
  created_at: Date
}
```

## Database Integration

### Summary Operations (via DatabaseAgent)
```javascript
export class SummaryDatabaseOperations {
  async storeDailySummary(summaryData) {
    // 1. Validate summary data structure
    const { query, values } = this.queryBuilder.buildInsert('summaries', 'daily_summaries', summaryData);
    
    // 2. Store daily summary with full data
    const result = await this.connector.query(query, values);
    return result.rows[0];
  }
  
  async getDailySummaryData(date, clientId) {
    // 1. Query daily summary by date and client
    const { query, values } = this.queryBuilder.buildSelect('summaries', 'daily_summaries', {
      date: date,
      client_id: clientId
    });
    
    const result = await this.connector.query(query, values);
    return result.rows[0] || null;
  }
  
  async storeMonthlyAggregate(monthlyData) {
    // 1. Store monthly summary with aggregated data
    const { query, values } = this.queryBuilder.buildInsert('summaries', 'monthly_summaries', monthlyData);
    
    const result = await this.connector.query(query, values);
    return result.rows[0];
  }
  
  async getMonthlyData(year, month, clientId) {
    // 1. Retrieve monthly summary data
    const { query, values } = this.queryBuilder.buildSelect('summaries', 'monthly_summaries', {
      year: year,
      month: month,
      client_id: clientId
    });
    
    const result = await this.connector.query(query, values);
    return result.rows[0] || null;
  }
  
  async storeYearlySummary(yearlyData) {
    // 1. Store comprehensive yearly summary
    const { query, values } = this.queryBuilder.buildInsert('summaries', 'yearly_summaries', yearlyData);
    
    const result = await this.connector.query(query, values);
    return result.rows[0];
  }
}
```

### Conversation Data Queries
```javascript
export class ConversationDataQueries {
  buildTurnsQuery(startDate, endDate, clientId) {
    // 1. Build comprehensive turns query with user data
    let turnsQuery = `
      SELECT t.id, t.content, t.source_type, t.created_at, t.metadata,
             u.email
      FROM meetings.turns t
      LEFT JOIN client_mgmt.users u ON t.user_id = u.id
      WHERE t.created_at >= $1::timestamp 
        AND t.created_at <= $2::timestamp
    `;
    
    let queryParams = [startDate, endDate];
    
    // 2. Add client filtering if specified
    if (clientId) {
      turnsQuery += ` AND t.client_id = $3`;
      queryParams.push(clientId);
    }
    
    turnsQuery += ` ORDER BY t.created_at ASC`;
    
    return { turnsQuery, queryParams };
  }
}
```

## AI Summary Generation

### Summary Processing Pipeline
```javascript
export class AISummaryGenerator {
  async generateDailySummary(turnsData, clientName, date) {
    // 1. Format conversation turns for AI processing
    const formattedTurns = this.formatTurnsForAI(turnsData);
    
    // 2. Build comprehensive summary prompt
    const prompt = this.buildDailySummaryPrompt(formattedTurns, clientName, date);
    
    // 3. Generate AI summary with appropriate length
    const summary = await this.generateAISummary(prompt, 800);
    
    return summary;
  }
  
  buildDailySummaryPrompt(formattedTurns, clientName, date) {
    return `Please create a concise daily summary of the following conversations from ${clientName} on ${date}.

Focus on:
- Key topics discussed
- Important questions asked  
- Main themes and patterns
- Any decisions or insights
- Notable interactions between users and the assistant

Conversations:
${formattedTurns}

Provide a well-structured summary in 2-3 paragraphs that captures the essence of the day's discussions.`;
  }
  
  formatTurnsForAI(turns) {
    // 1. Format each turn with speaker identification and timestamp
    return turns.map(turn => {
      const speaker = turn.source_type.includes('user') 
        ? `${turn.email || 'User'}` 
        : 'Assistant';
      
      const time = new Date(turn.created_at).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      return `[${time}] ${speaker}: ${turn.content}`;
    }).join('\n\n');
  }
}
```

## Utility Functions

### Common Summary Utilities
```javascript
export class SummaryUtilities {
  validateDate(date) {
    // 1. Validate date format (YYYY-MM-DD)
    return /^\d{4}-\d{2}-\d{2}$/.test(date);
  }
  
  getUserContext(req) {
    // 1. Extract user context from session
    let user_id;
    let client_id = null;
    let client_name = 'your organization';
    
    if (req.session && req.session.user) {
      user_id = req.session.user.user_id;
      client_id = req.session.user.client_id;
      client_name = req.session.user.client_name || client_name;
    } else if (process.env.NODE_ENV !== 'production') {
      user_id = 1; // Development fallback
    } else {
      throw new Error('Authentication required');
    }
    
    return { user_id, client_id, client_name };
  }
  
  calculateDataQualityScore(turnsData) {
    // 1. Assess completeness of conversation data
    const totalTurns = turnsData.length;
    const turnsWithEmail = turnsData.filter(t => t.email).length;
    const turnsWithContent = turnsData.filter(t => t.content && t.content.length > 10).length;
    
    // 2. Calculate quality score based on data completeness
    const emailCompleteness = turnsWithEmail / totalTurns;
    const contentCompleteness = turnsWithContent / totalTurns;
    
    return Math.round((emailCompleteness + contentCompleteness) / 2 * 100) / 100;
  }
}
```

## Performance Optimization

### Summary Generation Optimization
```javascript
export class SummaryOptimizer {
  async optimizeDailyProcessing(date, clientId) {
    // 1. Check if summary already exists
    const existingSummary = await this.checkExistingSummary(date, clientId);
    if (existingSummary && !this.shouldRegenerate(existingSummary)) {
      return existingSummary;
    }
    
    // 2. Process with efficient data fetching
    const conversationData = await this.fetchOptimizedConversationData(date, clientId);
    
    // 3. Generate summary with caching
    const summary = await this.generateWithCache(conversationData);
    
    return summary;
  }
  
  async batchProcessMultipleDays(dateRange, clientId) {
    // 1. Process multiple days efficiently
    const batchSize = 5;
    const results = [];
    
    for (let i = 0; i < dateRange.length; i += batchSize) {
      const batch = dateRange.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(date => this.optimizeDailyProcessing(date, clientId))
      );
      results.push(...batchResults);
    }
    
    return results;
  }
}
```

## Testing Strategies

### Summary System Testing
```javascript
describe('Summary System', () => {
  test('generates daily summary from conversation data', async () => {
    const mockTurns = [
      { content: 'User question about project', source_type: 'user_web', email: 'test@example.com' },
      { content: 'Assistant response with insights', source_type: 'llm_web' }
    ];
    
    const summary = await summarySystem.generateDailySummary('2024-01-15', 123, mockTurns);
    
    expect(summary).toContain('key topics');
    expect(summary.length).toBeGreaterThan(100);
  });
  
  test('validates date format correctly', () => {
    expect(SummaryUtilities.validateDate('2024-01-15')).toBe(true);
    expect(SummaryUtilities.validateDate('invalid-date')).toBe(false);
  });
  
  test('builds proper database queries', () => {
    const { turnsQuery, queryParams } = SummaryUtilities.buildTurnsQuery(
      '2024-01-15 00:00:00', 
      '2024-01-15 23:59:59', 
      123
    );
    
    expect(turnsQuery).toContain('SELECT t.id, t.content');
    expect(queryParams).toEqual(['2024-01-15 00:00:00', '2024-01-15 23:59:59', 123]);
  });
});
```
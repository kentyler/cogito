# Daily Summary System

## Purpose
Daily summary processing system that transforms raw conversation data into structured daily insights through AI analysis. Handles data collection, AI-powered summarization, and hierarchical aggregation into monthly and yearly summaries.

## Daily Summary Components

### Core Processing Files (in `archive/` subdirectory)
The daily summary system is organized with core processing files in the `archive/` subdirectory:

#### `daily-ai-summary.js`
**Purpose**: AI-powered daily summary generation
- Processes conversation data for specific dates into narrative summaries
- Handles date validation and user context extraction
- Formats conversation turns for optimal AI analysis
- Generates structured daily insights using LLM processing

```javascript
export async function generateDailySummary(req, res) {
  try {
    // 1. Extract and validate date parameter
    const { date } = req.body;
    if (!date || !validateDate(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    // 2. Get user context (user_id, client_id, client_name)
    const { user_id, client_id, client_name } = getUserContext(req);
    
    // 3. Build date range for query (full day)
    const startDate = `${date} 00:00:00`;
    const endDate = `${date} 23:59:59`;
    
    // 4. Query conversation turns for the date
    const { turnsQuery, queryParams } = buildTurnsQuery(startDate, endDate, client_id);
    const turnsResult = await req.pool.query(turnsQuery, queryParams);
    
    // 5. Handle case of no conversation data
    if (turnsResult.rows.length === 0) {
      return res.json({ summary: 'No activity found for this date.' });
    }
    
    // 6. Format turns for AI processing
    const formattedTurns = formatTurnsForAI(turnsResult.rows);
    
    // 7. Build comprehensive summary prompt
    const prompt = `Please create a concise daily summary of the following conversations from ${client_name} on ${date}.

Focus on:
- Key topics discussed
- Important questions asked
- Main themes and patterns
- Any decisions or insights
- Notable interactions between users and the assistant

Conversations:
${formattedTurns}

Provide a well-structured summary in 2-3 paragraphs that captures the essence of the day's discussions.`;

    // 8. Generate AI summary with appropriate length limit
    const summary = await generateAISummary(req.anthropic, prompt, 800);
    
    // 9. Return generated summary
    res.json({ summary });
    
  } catch (error) {
    // 10. Handle authentication and general errors
    if (error.message === 'Authentication required') {
      return res.status(401).json({ error: error.message });
    }
    console.error('Generate daily summary error:', error);
    res.status(500).json({ error: 'Failed to generate daily summary' });
  }
}
```

#### `daily-data.js`
**Purpose**: Daily conversation data retrieval and structuring
- Retrieves raw conversation data for specific dates
- Separates user turns from assistant turns
- Formats data for client consumption and analysis
- Provides structured daily data for further processing

```javascript
export async function getDailySummaryData(req, res) {
  try {
    // 1. Extract date from URL parameters
    const { date } = req.params;
    
    // 2. Validate date format
    if (!validateDate(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    // 3. Get authenticated user context
    const { user_id, client_id } = getUserContext(req);
    
    // 4. Build full day date range
    const startDate = `${date} 00:00:00`;
    const endDate = `${date} 23:59:59`;
    
    // 5. Query all turns for the date with user information
    const { turnsQuery, queryParams } = buildTurnsQuery(startDate, endDate, client_id);
    const turnsResult = await req.pool.query(turnsQuery, queryParams);
    
    // 6. Separate user turns from assistant turns
    const userTurns = turnsResult.rows.filter(turn => 
      turn.source_type && turn.source_type.includes('user'));
    const assistantTurns = turnsResult.rows.filter(turn => 
      turn.source_type && turn.source_type.includes('llm'));
    
    // 7. Return structured daily data
    res.json({
      date,
      user_turns: userTurns.map(turn => ({
        turn_id: turn.turn_id,
        content: turn.content,
        source_type: turn.source_type,
        created_at: turn.created_at,
        email: turn.email
      })),
      assistant_turns: assistantTurns.map(turn => ({
        turn_id: turn.turn_id,
        content: turn.content,
        source_type: turn.source_type,
        created_at: turn.created_at
      })),
      total_turns: turnsResult.rows.length
    });
    
  } catch (error) {
    // 8. Handle authentication and database errors
    if (error.message === 'Authentication required') {
      return res.status(401).json({ error: error.message });
    }
    console.error('Daily summary data error:', error);
    res.status(500).json({ error: 'Failed to fetch daily summary data' });
  }
}
```

#### `monthly-summaries.js`
**Purpose**: Monthly summary compilation from daily data
- Aggregates daily summaries into monthly patterns
- Identifies trending topics and engagement patterns
- Calculates monthly metrics and growth trends
- Generates comprehensive monthly insights

```javascript
export async function generateMonthlySummaries(req, res) {
  try {
    // 1. Extract month/year parameters and validate
    const { year, month, client_id } = req.body;
    
    // 2. Collect all daily summaries for the month
    const dailySummaries = await collectDailySummariesForMonth(year, month, client_id);
    
    // 3. Analyze patterns across daily summaries
    const monthlyPatterns = await analyzeMonthlyPatterns(dailySummaries);
    
    // 4. Identify trending topics and themes
    const trendingTopics = await identifyTrendingTopics(dailySummaries);
    
    // 5. Calculate engagement metrics
    const engagementMetrics = await calculateMonthlyEngagement(dailySummaries);
    
    // 6. Generate AI-powered monthly summary
    const monthlySummary = await generateAIMonthlySummary(dailySummaries, year, month);
    
    // 7. Compile comprehensive monthly data
    const monthlyData = {
      year,
      month,
      client_id,
      daily_summaries_count: dailySummaries.length,
      trending_topics: trendingTopics,
      patterns: monthlyPatterns,
      engagement: engagementMetrics,
      ai_summary: monthlySummary
    };
    
    // 8. Store monthly summary data
    await storeMonthlyData(monthlyData);
    
    res.json({ message: 'Monthly summaries generated successfully', data: monthlyData });
    
  } catch (error) {
    console.error('Generate monthly summaries error:', error);
    res.status(500).json({ error: 'Failed to generate monthly summaries' });
  }
}
```

#### `yearly-summaries.js`
**Purpose**: Yearly summary compilation from monthly data
- Compiles monthly summaries into yearly overviews
- Identifies long-term trends and strategic insights
- Calculates annual growth and engagement patterns
- Generates comprehensive yearly analysis

```javascript
export async function generateYearlySummaries(req, res) {
  try {
    // 1. Extract year parameter and validate
    const { year, client_id } = req.body;
    
    // 2. Collect all monthly summaries for the year
    const monthlySummaries = await collectMonthlySummariesForYear(year, client_id);
    
    // 3. Analyze yearly trends across months
    const yearlyTrends = await analyzeYearlyTrends(monthlySummaries);
    
    // 4. Identify major themes and breakthrough moments
    const majorThemes = await identifyMajorThemes(monthlySummaries);
    
    // 5. Calculate annual growth metrics
    const growthMetrics = await calculateAnnualGrowth(monthlySummaries);
    
    // 6. Generate strategic insights and patterns
    const strategicInsights = await generateStrategicInsights(monthlySummaries);
    
    // 7. Create comprehensive yearly narrative
    const yearlyNarrative = await generateAIYearlySummary(monthlySummaries, year);
    
    // 8. Compile complete yearly summary
    const yearlyData = {
      year,
      client_id,
      monthly_summaries_count: monthlySummaries.length,
      major_themes: majorThemes,
      trends: yearlyTrends,
      growth: growthMetrics,
      insights: strategicInsights,
      narrative: yearlyNarrative
    };
    
    // 9. Store yearly summary data
    await storeYearlyData(yearlyData);
    
    res.json({ message: 'Yearly summaries generated successfully', data: yearlyData });
    
  } catch (error) {
    console.error('Generate yearly summaries error:', error);
    res.status(500).json({ error: 'Failed to generate yearly summaries' });
  }
}
```

#### `utils.js`
**Purpose**: Common utility functions for summary processing
- Provides date validation and formatting utilities
- Handles user context extraction and authentication
- Builds database queries for conversation data
- Formats conversation data for AI processing

```javascript
export function validateDate(date) {
  // 1. Validate YYYY-MM-DD date format
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

export function getUserContext(req) {
  // 1. Extract user context from session or environment
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

export function buildTurnsQuery(startDate, endDate, client_id) {
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
  if (client_id) {
    turnsQuery += ` AND t.client_id = $3`;
    queryParams.push(client_id);
  }
  
  turnsQuery += ` ORDER BY t.created_at ASC`;
  
  return { turnsQuery, queryParams };
}

export function formatTurnsForAI(turns) {
  // 1. Format each turn with speaker and timestamp
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

export async function generateAISummary(anthropicClient, prompt, maxTokens) {
  // 1. Generate AI summary with specified token limit
  try {
    const response = await anthropicClient.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }]
    });
    
    return response.content[0].text;
  } catch (error) {
    console.error('AI summary generation error:', error);
    throw new Error('Failed to generate AI summary');
  }
}
```

## Daily Summary Processing Pipeline

### Data Flow Architecture
```
Request → Validation → Data Collection → AI Processing → Response
   ↓           ↓              ↓              ↓            ↓
Date Check  User Auth    Query Turns    Format Data   Return Summary
Client ID   Session      Filter Data    AI Analysis   Store Results
Format      Context      User/LLM       Generate      Send Response
```

### Processing Steps
```javascript
export class DailySummaryProcessor {
  async processDailySummary(date, clientId, userId) {
    // 1. Validation phase
    await this.validateInputs(date, clientId, userId);
    
    // 2. Data collection phase
    const conversationData = await this.collectConversationData(date, clientId);
    
    // 3. Data processing phase
    const processedData = await this.processConversationData(conversationData);
    
    // 4. AI analysis phase
    const aiSummary = await this.generateAISummary(processedData);
    
    // 5. Storage phase
    const summaryRecord = await this.storeDailySummary(date, clientId, aiSummary, processedData);
    
    return summaryRecord;
  }
}
```

## Database Integration

### Daily Summary Data Operations
```javascript
export class DailySummaryDataOperations {
  async collectConversationData(date, clientId) {
    // 1. Build date range query
    const startDate = `${date} 00:00:00`;
    const endDate = `${date} 23:59:59`;
    
    // 2. Query turns with user data
    const { turnsQuery, queryParams } = buildTurnsQuery(startDate, endDate, clientId);
    const result = await this.pool.query(turnsQuery, queryParams);
    
    return result.rows;
  }
  
  async storeDailySummary(date, clientId, summary, metadata) {
    // 1. Prepare summary data for storage
    const summaryData = {
      date,
      client_id: clientId,
      ai_summary: summary,
      metadata,
      created_at: new Date()
    };
    
    // 2. Store or update daily summary
    const query = `
      INSERT INTO summaries.daily_summaries (date, client_id, ai_summary, metadata, created_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (date, client_id) 
      DO UPDATE SET ai_summary = $3, metadata = $4, updated_at = NOW()
      RETURNING *
    `;
    
    const result = await this.pool.query(query, [date, clientId, summary, JSON.stringify(metadata), new Date()]);
    return result.rows[0];
  }
}
```

## Authentication and Security

### User Context Management
```javascript
export class SummarySecurityManager {
  validateUserAccess(req) {
    // 1. Check session authentication
    if (!req.session?.user) {
      throw new Error('Authentication required');
    }
    
    // 2. Validate client access permissions
    const userId = req.session.user.user_id;
    const clientId = req.session.user.client_id;
    
    if (!this.hasClientAccess(userId, clientId)) {
      throw new Error('Access denied to client data');
    }
    
    return { userId, clientId };
  }
  
  sanitizeSummaryData(summaryData) {
    // 1. Remove sensitive information from summary
    return {
      ...summaryData,
      // Remove personal identifiers while preserving insights
      user_turns: summaryData.user_turns?.map(turn => ({
        ...turn,
        email: this.maskEmail(turn.email)
      }))
    };
  }
}
```

## Testing Strategies

### Daily Summary Testing
```javascript
describe('Daily Summary System', () => {
  test('generates AI summary from conversation data', async () => {
    const mockTurns = [
      { 
        content: 'What are the key features of our product?', 
        source_type: 'user_web', 
        email: 'user@example.com',
        created_at: '2024-01-15T10:00:00Z'
      },
      { 
        content: 'Our product offers advanced analytics, real-time collaboration, and seamless integration.',
        source_type: 'llm_web',
        created_at: '2024-01-15T10:01:00Z'
      }
    ];
    
    const formattedTurns = formatTurnsForAI(mockTurns);
    expect(formattedTurns).toContain('[10:00 AM] user@example.com: What are the key features');
    expect(formattedTurns).toContain('[10:01 AM] Assistant: Our product offers advanced');
  });
  
  test('validates date formats correctly', () => {
    expect(validateDate('2024-01-15')).toBe(true);
    expect(validateDate('2024-1-15')).toBe(false);
    expect(validateDate('invalid-date')).toBe(false);
  });
  
  test('builds correct database queries', () => {
    const { turnsQuery, queryParams } = buildTurnsQuery(
      '2024-01-15 00:00:00', 
      '2024-01-15 23:59:59', 
      123
    );
    
    expect(turnsQuery).toContain('t.created_at >= $1::timestamp');
    expect(turnsQuery).toContain('AND t.client_id = $3');
    expect(queryParams).toEqual(['2024-01-15 00:00:00', '2024-01-15 23:59:59', 123]);
  });
  
  test('separates user and assistant turns correctly', () => {
    const mockTurns = [
      { source_type: 'user_web', content: 'User question' },
      { source_type: 'llm_web', content: 'Assistant response' },
      { source_type: 'user_mobile', content: 'Another user message' }
    ];
    
    const userTurns = mockTurns.filter(turn => turn.source_type.includes('user'));
    const assistantTurns = mockTurns.filter(turn => turn.source_type.includes('llm'));
    
    expect(userTurns).toHaveLength(2);
    expect(assistantTurns).toHaveLength(1);
  });
});
```
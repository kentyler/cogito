# Daily Summary Archive Components

## Purpose
Core implementation files for the daily summary system, containing the actual processing logic for AI-powered summary generation, data collection, aggregation, and utility functions. These files implement the complete daily summary pipeline.

## Archive Component Files

### `daily-ai-summary.js`
**Purpose**: AI-powered daily summary generation endpoint
- Implements the main daily summary generation API endpoint
- Handles request validation and user authentication
- Processes conversation data through AI analysis pipeline
- Returns formatted daily summaries with error handling

```javascript
export async function generateDailySummary(req, res) {
  try {
    // 1. Extract and validate date from request
    const { date } = req.body;
    if (!date || !validateDate(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    // 2. Get authenticated user context
    const { user_id, client_id, client_name } = getUserContext(req);
    
    // 3. Define date range for conversation query
    const startDate = `${date} 00:00:00`;
    const endDate = `${date} 23:59:59`;
    
    // 4. Build and execute conversation data query
    const { turnsQuery, queryParams } = buildTurnsQuery(startDate, endDate, client_id);
    const turnsResult = await req.pool.query(turnsQuery, queryParams);
    
    // 5. Handle empty conversation data
    if (turnsResult.rows.length === 0) {
      return res.json({ summary: 'No activity found for this date.' });
    }
    
    // 6. Format conversation turns for AI processing
    const formattedTurns = formatTurnsForAI(turnsResult.rows);
    
    // 7. Build comprehensive AI prompt for summary generation
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

    // 8. Generate AI summary with token limit
    const summary = await generateAISummary(req.anthropic, prompt, 800);
    
    // 9. Return generated summary
    res.json({ summary });
    
  } catch (error) {
    // 10. Handle authentication and processing errors
    if (error.message === 'Authentication required') {
      return res.status(401).json({ error: error.message });
    }
    console.error('Generate daily summary error:', error);
    res.status(500).json({ error: 'Failed to generate daily summary' });
  }
}
```

### `daily-data.js`
**Purpose**: Daily conversation data retrieval API endpoint
- Provides structured access to raw daily conversation data
- Separates user turns from assistant turns for analysis
- Returns formatted daily data with metadata
- Handles authentication and data access permissions

```javascript
export async function getDailySummaryData(req, res) {
  try {
    // 1. Extract date parameter from URL
    const { date } = req.params;
    
    // 2. Validate date format
    if (!validateDate(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    // 3. Authenticate user and get context
    const { user_id, client_id } = getUserContext(req);
    
    // 4. Build full day date range
    const startDate = `${date} 00:00:00`;
    const endDate = `${date} 23:59:59`;
    
    // 5. Query conversation turns with user information
    const { turnsQuery, queryParams } = buildTurnsQuery(startDate, endDate, client_id);
    const turnsResult = await req.pool.query(turnsQuery, queryParams);
    
    // 6. Categorize turns by speaker type
    const userTurns = turnsResult.rows.filter(turn => 
      turn.source_type && turn.source_type.includes('user'));
    const assistantTurns = turnsResult.rows.filter(turn => 
      turn.source_type && turn.source_type.includes('llm'));
    
    // 7. Return structured daily conversation data
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

### `monthly-summaries.js`
**Purpose**: Monthly summary aggregation from daily data
- Compiles multiple daily summaries into monthly patterns
- Identifies trending topics and engagement metrics
- Generates monthly insights and growth analysis
- Produces comprehensive monthly summary reports

```javascript
export async function generateMonthlySummaries(req, res) {
  try {
    // 1. Extract and validate monthly parameters
    const { year, month, client_id } = req.body;
    
    if (!year || !month || !client_id) {
      return res.status(400).json({ error: 'Year, month, and client_id are required' });
    }
    
    // 2. Authenticate user and validate client access
    const { user_id } = getUserContext(req);
    const hasAccess = await validateClientAccess(user_id, client_id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to client data' });
    }
    
    // 3. Collect all daily summaries for the month
    const dailySummaries = await collectDailySummariesForMonth(req.pool, year, month, client_id);
    
    if (dailySummaries.length === 0) {
      return res.json({ message: 'No daily summaries found for this month', summaries: [] });
    }
    
    // 4. Analyze conversation patterns across the month
    const monthlyPatterns = await analyzeMonthlyPatterns(dailySummaries);
    
    // 5. Identify trending topics and themes
    const trendingTopics = await identifyTrendingTopics(dailySummaries);
    
    // 6. Calculate engagement and interaction metrics
    const engagementMetrics = await calculateMonthlyEngagement(dailySummaries);
    
    // 7. Generate AI-powered monthly narrative
    const monthlyNarrative = await generateMonthlyNarrative(req.anthropic, dailySummaries, year, month);
    
    // 8. Compile comprehensive monthly summary
    const monthlyData = {
      year,
      month,
      client_id,
      daily_summaries_processed: dailySummaries.length,
      trending_topics: trendingTopics,
      patterns: monthlyPatterns,
      engagement_metrics: engagementMetrics,
      monthly_narrative: monthlyNarrative,
      generated_at: new Date()
    };
    
    // 9. Store monthly summary in database
    const storedSummary = await storeMonthlyData(req.pool, monthlyData);
    
    res.json({ 
      message: 'Monthly summaries generated successfully', 
      data: storedSummary 
    });
    
  } catch (error) {
    console.error('Generate monthly summaries error:', error);
    res.status(500).json({ error: 'Failed to generate monthly summaries' });
  }
}

async function collectDailySummariesForMonth(pool, year, month, clientId) {
  // 1. Query all daily summaries for the specified month
  const query = `
    SELECT * FROM summaries.daily_summaries 
    WHERE EXTRACT(YEAR FROM date) = $1 
      AND EXTRACT(MONTH FROM date) = $2 
      AND client_id = $3
    ORDER BY date ASC
  `;
  
  const result = await pool.query(query, [year, month, clientId]);
  return result.rows;
}

async function analyzeMonthlyPatterns(dailySummaries) {
  // 1. Identify most active days of the month
  const activityByDay = dailySummaries.reduce((acc, summary) => {
    const day = new Date(summary.date).getDay();
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day];
    acc[dayName] = (acc[dayName] || 0) + summary.total_turns;
    return acc;
  }, {});
  
  // 2. Find peak activity periods
  const mostActiveDay = Object.keys(activityByDay).reduce((a, b) => 
    activityByDay[a] > activityByDay[b] ? a : b
  );
  
  // 3. Calculate conversation length trends
  const avgTurnsPerDay = dailySummaries.reduce((sum, s) => sum + s.total_turns, 0) / dailySummaries.length;
  
  return {
    most_active_day: mostActiveDay,
    activity_by_day: activityByDay,
    average_turns_per_day: Math.round(avgTurnsPerDay),
    total_active_days: dailySummaries.length
  };
}
```

### `yearly-summaries.js`
**Purpose**: Yearly summary compilation from monthly data
- Aggregates monthly summaries into yearly strategic insights
- Identifies long-term trends and breakthrough moments
- Calculates annual growth and development patterns
- Generates comprehensive yearly analysis reports

```javascript
export async function generateYearlySummaries(req, res) {
  try {
    // 1. Extract and validate yearly parameters
    const { year, client_id } = req.body;
    
    if (!year || !client_id) {
      return res.status(400).json({ error: 'Year and client_id are required' });
    }
    
    // 2. Authenticate user and validate access
    const { user_id } = getUserContext(req);
    const hasAccess = await validateClientAccess(user_id, client_id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to client data' });
    }
    
    // 3. Collect all monthly summaries for the year
    const monthlySummaries = await collectMonthlySummariesForYear(req.pool, year, client_id);
    
    if (monthlySummaries.length === 0) {
      return res.json({ message: 'No monthly summaries found for this year', summaries: [] });
    }
    
    // 4. Analyze yearly trends and patterns
    const yearlyTrends = await analyzeYearlyTrends(monthlySummaries);
    
    // 5. Identify major themes and breakthrough moments
    const majorThemes = await identifyMajorThemes(monthlySummaries);
    
    // 6. Calculate annual growth metrics
    const growthMetrics = await calculateAnnualGrowth(monthlySummaries);
    
    // 7. Generate strategic insights from yearly data
    const strategicInsights = await generateStrategicInsights(monthlySummaries);
    
    // 8. Create comprehensive yearly narrative
    const yearlyNarrative = await generateYearlyNarrative(req.anthropic, monthlySummaries, year);
    
    // 9. Compile complete yearly summary
    const yearlyData = {
      year,
      client_id,
      monthly_summaries_processed: monthlySummaries.length,
      major_themes: majorThemes,
      yearly_trends: yearlyTrends,
      growth_metrics: growthMetrics,
      strategic_insights: strategicInsights,
      yearly_narrative: yearlyNarrative,
      generated_at: new Date()
    };
    
    // 10. Store yearly summary in database
    const storedSummary = await storeYearlyData(req.pool, yearlyData);
    
    res.json({ 
      message: 'Yearly summaries generated successfully', 
      data: storedSummary 
    });
    
  } catch (error) {
    console.error('Generate yearly summaries error:', error);
    res.status(500).json({ error: 'Failed to generate yearly summaries' });
  }
}

async function analyzeYearlyTrends(monthlySummaries) {
  // 1. Track engagement growth over months
  const engagementTrend = monthlySummaries.map(month => ({
    month: month.month,
    engagement: month.engagement_metrics?.total_interactions || 0
  }));
  
  // 2. Identify seasonal patterns
  const seasonalPatterns = {
    spring: monthlySummaries.filter(m => [3,4,5].includes(m.month)),
    summer: monthlySummaries.filter(m => [6,7,8].includes(m.month)),
    fall: monthlySummaries.filter(m => [9,10,11].includes(m.month)),
    winter: monthlySummaries.filter(m => [12,1,2].includes(m.month))
  };
  
  // 3. Calculate year-over-year growth
  const totalEngagement = engagementTrend.reduce((sum, month) => sum + month.engagement, 0);
  const avgMonthlyEngagement = totalEngagement / monthlySummaries.length;
  
  return {
    engagement_trend: engagementTrend,
    seasonal_patterns: seasonalPatterns,
    total_yearly_engagement: totalEngagement,
    average_monthly_engagement: Math.round(avgMonthlyEngagement)
  };
}
```

### `utils.js`
**Purpose**: Common utility functions for summary processing
- Provides date validation and formatting functions
- Handles user authentication and context extraction
- Builds optimized database queries for conversation data
- Formats data for AI processing and analysis

```javascript
export function validateDate(date) {
  // 1. Validate YYYY-MM-DD date format using regex
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

export function getUserContext(req) {
  // 1. Extract user context from authenticated session
  let user_id;
  let client_id = null;
  let client_name = 'your organization';
  
  if (req.session && req.session.user) {
    // 2. Use authenticated session data
    user_id = req.session.user.user_id;
    client_id = req.session.user.client_id;
    client_name = req.session.user.client_name || client_name;
  } else if (process.env.NODE_ENV !== 'production') {
    // 3. Development mode fallback
    user_id = 1;
  } else {
    // 4. Require authentication in production
    throw new Error('Authentication required');
  }
  
  return { user_id, client_id, client_name };
}

export function buildTurnsQuery(startDate, endDate, client_id) {
  // 1. Build comprehensive query to get conversation turns with user data
  let turnsQuery = `
    SELECT t.id, t.content, t.source_type, t.created_at, t.metadata,
           u.email
    FROM meetings.turns t
    LEFT JOIN client_mgmt.users u ON t.user_id = u.id
    WHERE t.created_at >= $1::timestamp 
      AND t.created_at <= $2::timestamp
  `;
  
  let queryParams = [startDate, endDate];
  
  // 2. Add client filtering if client_id is specified
  if (client_id) {
    turnsQuery += ` AND t.client_id = $3`;
    queryParams.push(client_id);
  }
  
  // 3. Order by creation time for chronological processing
  turnsQuery += ` ORDER BY t.created_at ASC`;
  
  return { turnsQuery, queryParams };
}

export function formatTurnsForAI(turns) {
  // 1. Format conversation turns for optimal AI processing
  return turns.map(turn => {
    // 2. Identify speaker (user email or Assistant)
    const speaker = turn.source_type.includes('user') 
      ? `${turn.email || 'User'}` 
      : 'Assistant';
      
    // 3. Format timestamp for readability
    const time = new Date(turn.created_at).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // 4. Create formatted turn entry
    return `[${time}] ${speaker}: ${turn.content}`;
  }).join('\n\n');
}

export async function generateAISummary(anthropicClient, prompt, maxTokens) {
  // 1. Generate AI summary using Anthropic Claude
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

export function calculateDataQualityScore(turnsData) {
  // 1. Assess data completeness for quality scoring
  if (!turnsData || turnsData.length === 0) {
    return 0;
  }
  
  const totalTurns = turnsData.length;
  const turnsWithEmail = turnsData.filter(t => t.email).length;
  const turnsWithContent = turnsData.filter(t => t.content && t.content.length > 10).length;
  const turnsWithMetadata = turnsData.filter(t => t.metadata).length;
  
  // 2. Calculate weighted quality score
  const emailCompleteness = turnsWithEmail / totalTurns * 0.3;
  const contentCompleteness = turnsWithContent / totalTurns * 0.5;
  const metadataCompleteness = turnsWithMetadata / totalTurns * 0.2;
  
  return Math.round((emailCompleteness + contentCompleteness + metadataCompleteness) * 100) / 100;
}

export function extractKeyTopics(turns) {
  // 1. Extract key topics from conversation content
  const contentWords = turns
    .map(turn => turn.content.toLowerCase())
    .join(' ')
    .split(/\s+/)
    .filter(word => word.length > 4);
  
  // 2. Count word frequency
  const wordFreq = contentWords.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {});
  
  // 3. Return top topics by frequency
  return Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word, count]) => ({ topic: word, frequency: count }));
}

export function calculateEngagementMetrics(turns) {
  // 1. Calculate conversation engagement metrics
  const userTurns = turns.filter(t => t.source_type.includes('user'));
  const assistantTurns = turns.filter(t => t.source_type.includes('llm'));
  
  // 2. Calculate average turn length
  const avgUserTurnLength = userTurns.reduce((sum, t) => sum + t.content.length, 0) / userTurns.length || 0;
  const avgAssistantTurnLength = assistantTurns.reduce((sum, t) => sum + t.content.length, 0) / assistantTurns.length || 0;
  
  // 3. Calculate interaction patterns
  const totalInteractions = turns.length;
  const userToAssistantRatio = userTurns.length / assistantTurns.length || 0;
  
  return {
    total_interactions: totalInteractions,
    user_turns: userTurns.length,
    assistant_turns: assistantTurns.length,
    user_to_assistant_ratio: Math.round(userToAssistantRatio * 100) / 100,
    avg_user_turn_length: Math.round(avgUserTurnLength),
    avg_assistant_turn_length: Math.round(avgAssistantTurnLength)
  };
}
```

## Integration Patterns

### Database Connection Pattern
```javascript
// All functions expect req.pool for database connectivity
export async function processWithDatabase(req, res) {
  try {
    // Use req.pool for database queries
    const result = await req.pool.query('SELECT * FROM table');
    // Process result
  } catch (error) {
    // Handle database errors
  }
}
```

### AI Service Integration Pattern
```javascript
// All AI functions expect req.anthropic client
export async function processWithAI(req, res) {
  try {
    // Use req.anthropic for AI processing
    const summary = await generateAISummary(req.anthropic, prompt, maxTokens);
    // Return processed result
  } catch (error) {
    // Handle AI service errors
  }
}
```

### Error Handling Pattern
```javascript
// Consistent error handling across all endpoints
export async function handleRequest(req, res) {
  try {
    // Main processing logic
  } catch (error) {
    if (error.message === 'Authentication required') {
      return res.status(401).json({ error: error.message });
    }
    console.error('Processing error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
}
```

## Testing Strategies

### Archive Component Testing
```javascript
describe('Daily Summary Archive Components', () => {
  test('formatTurnsForAI creates proper conversation format', () => {
    const mockTurns = [
      {
        content: 'Hello, how can I help?',
        source_type: 'user_web',
        email: 'user@example.com',
        created_at: '2024-01-15T10:00:00Z'
      },
      {
        content: 'I can help with your questions.',
        source_type: 'llm_web',
        created_at: '2024-01-15T10:01:00Z'
      }
    ];
    
    const formatted = formatTurnsForAI(mockTurns);
    
    expect(formatted).toContain('[10:00 AM] user@example.com: Hello, how can I help?');
    expect(formatted).toContain('[10:01 AM] Assistant: I can help with your questions.');
  });
  
  test('buildTurnsQuery constructs proper SQL', () => {
    const { turnsQuery, queryParams } = buildTurnsQuery(
      '2024-01-15 00:00:00',
      '2024-01-15 23:59:59',
      123
    );
    
    expect(turnsQuery).toContain('SELECT t.id, t.content, t.source_type');
    expect(turnsQuery).toContain('LEFT JOIN client_mgmt.users u');
    expect(turnsQuery).toContain('AND t.client_id = $3');
    expect(queryParams).toEqual(['2024-01-15 00:00:00', '2024-01-15 23:59:59', 123]);
  });
  
  test('calculateDataQualityScore assesses data completeness', () => {
    const mockTurns = [
      { email: 'user@example.com', content: 'This is a substantial message', metadata: {} },
      { email: null, content: 'Short', metadata: null },
      { email: 'user2@example.com', content: 'Another substantial message with good content', metadata: {} }
    ];
    
    const score = calculateDataQualityScore(mockTurns);
    
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});
```
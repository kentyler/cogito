import { validateDate, getUserContext, buildTurnsQuery, formatTurnsForAI, generateAISummary } from './utils.js';

export async function generateDailySummary(req, res) {
  try {
    const { date } = req.body;
    
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }
    
    if (!validateDate(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    const { user_id, client_id, client_name } = getUserContext(req);
    
    const startDate = `${date} 00:00:00`;
    const endDate = `${date} 23:59:59`;
    
    const { turnsQuery, queryParams } = buildTurnsQuery({ startDate, endDate, clientId: client_id });
    const turnsResult = await req.pool.query(turnsQuery, queryParams);
    
    if (turnsResult.rows.length === 0) {
      return res.json({ summary: 'No activity found for this date.' });
    }
    
    const formattedTurns = formatTurnsForAI(turnsResult.rows);
    
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

    const summary = await generateAISummary({ 
      anthropic: req.anthropic, 
      prompt, 
      maxTokens: 800 
    });
    res.json({ summary });
    
  } catch (error) {
    if (error.message === 'Authentication required') {
      return res.status(401).json({ error: error.message });
    }
    console.error('Generate daily summary error:', error);
    res.status(500).json({ error: 'Failed to generate daily summary' });
  }
}
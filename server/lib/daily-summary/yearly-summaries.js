import { getUserContext, buildTurnsQuery, generateAISummary } from './utils.js';

export async function generateYearlySummaries(req, res) {
  try {
    const { year } = req.body;
    
    if (!year) {
      return res.status(400).json({ error: 'Year is required' });
    }
    
    if (year < 2020 || year > new Date().getFullYear() + 1) {
      return res.status(400).json({ error: 'Invalid year' });
    }
    
    const { user_id, client_id, client_name } = getUserContext(req);
    const summaries = {};
    
    for (let month = 0; month < 12; month++) {
      const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01 00:00:00`;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')} 23:59:59`;
      
      const { turnsQuery, queryParams } = buildTurnsQuery(startDate, endDate, client_id);
      
      try {
        const turnsResult = await req.pool.query(turnsQuery, queryParams);
        
        if (turnsResult.rows.length > 0) {
          const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long' });
          
          const prompt = `Please create a comprehensive monthly summary of conversations from ${client_name} for ${monthName} ${year}.

Based on ${turnsResult.rows.length} conversations, focus on:
- Major themes and topics that dominated the month
- Key decisions or insights that emerged
- Evolution of discussions throughout the month
- Notable participant engagement patterns
- Important questions or challenges that were explored

Provide a well-structured summary in 3-4 paragraphs that captures the essence of the month's discussions.`;

          const summary = await generateAISummary(req.anthropic, prompt, 600);
          
          summaries[month] = {
            summary,
            turnCount: turnsResult.rows.length,
            userTurns: turnsResult.rows.filter(t => t.source_type.includes('user')).length,
            assistantTurns: turnsResult.rows.filter(t => t.source_type.includes('llm')).length
          };
        }
      } catch (monthError) {
        console.error(`Error processing ${month + 1}/${year}:`, monthError);
      }
    }
    
    res.json({ summaries, year });
    
  } catch (error) {
    if (error.message === 'Authentication required') {
      return res.status(401).json({ error: error.message });
    }
    console.error('Generate yearly summaries error:', error);
    res.status(500).json({ error: 'Failed to generate yearly summaries' });
  }
}
import { getUserContext, buildTurnsQuery, formatTurnsForAI, generateAISummary } from './utils.js';

export async function generateMonthlySummaries(req, res) {
  try {
    const { year, month } = req.body;
    
    if (!year || month === undefined) {
      return res.status(400).json({ error: 'Year and month are required' });
    }
    
    if (year < 2020 || year > new Date().getFullYear() + 1) {
      return res.status(400).json({ error: 'Invalid year' });
    }
    if (month < 0 || month > 11) {
      return res.status(400).json({ error: 'Invalid month (0-11)' });
    }
    
    const { user_id, client_id, client_name } = getUserContext(req);
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const summaries = {};
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const startDate = `${date} 00:00:00`;
      const endDate = `${date} 23:59:59`;
      
      const { turnsQuery, queryParams } = buildTurnsQuery({ startDate, endDate, clientId: client_id });
      
      try {
        const turnsResult = await req.pool.query(turnsQuery, queryParams);
        
        if (turnsResult.rows.length > 0) {
          const formattedTurns = formatTurnsForAI(turnsResult.rows);
          
          const prompt = `Please create a concise daily summary of the following conversations from ${client_name} on ${date}.

Focus on:
- Key topics discussed (2-3 main themes)
- Important questions asked
- Any decisions or insights
- Brief mention of participant interactions

Keep it concise (2-3 sentences maximum):

Conversations:
${formattedTurns}`;

          const summary = await generateAISummary({ 
            anthropic: req.anthropic, 
            prompt, 
            maxTokens: 300 
          });
          
          summaries[date] = {
            summary,
            turnCount: turnsResult.rows.length,
            userTurns: turnsResult.rows.filter(t => t.source_type.includes('user')).length,
            assistantTurns: turnsResult.rows.filter(t => t.source_type.includes('llm')).length
          };
        }
      } catch (dayError) {
        console.error(`Error processing day ${date}:`, dayError);
      }
    }
    
    res.json({ 
      summaries,
      year,
      month,
      monthName: new Date(year, month).toLocaleDateString('en-US', { month: 'long' })
    });
    
  } catch (error) {
    if (error.message === 'Authentication required') {
      return res.status(401).json({ error: error.message });
    }
    console.error('Generate monthly summaries error:', error);
    res.status(500).json({ error: 'Failed to generate monthly summaries' });
  }
}
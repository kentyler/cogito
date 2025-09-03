import { validateDate, getUserContext, buildTurnsQuery } from './utils.js';

export async function getDailySummaryData(req, res) {
  try {
    const { date } = req.params;
    
    if (!validateDate(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    const { user_id, client_id } = getUserContext(req);
    
    const startDate = `${date} 00:00:00`;
    const endDate = `${date} 23:59:59`;
    
    const { turnsQuery, queryParams } = buildTurnsQuery({ startDate, endDate, clientId: client_id });
    const turnsResult = await req.pool.query(turnsQuery, queryParams);
    
    const userTurns = turnsResult.rows.filter(turn => 
      turn.source_type && turn.source_type.includes('user'));
    const assistantTurns = turnsResult.rows.filter(turn => 
      turn.source_type && turn.source_type.includes('llm'));
    
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
    if (error.message === 'Authentication required') {
      return res.status(401).json({ error: error.message });
    }
    console.error('Daily summary data error:', error);
    res.status(500).json({ error: 'Failed to fetch daily summary data' });
  }
}
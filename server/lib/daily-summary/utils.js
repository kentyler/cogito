export function validateDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

export function getUserContext(req) {
  let user_id;
  let client_id = null;
  let client_name = 'your organization';
  
  if (req.session && req.session.user) {
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

export function buildTurnsQuery(startDate, endDate, client_id) {
  let turnsQuery = `
    SELECT t.turn_id, t.content, t.source_type, t.created_at, t.metadata,
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

export function formatTurnsForAI(turns) {
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

export async function generateAISummary(anthropic, prompt, maxTokens = 300) {
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
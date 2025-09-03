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

/**
 * Build SQL query for fetching turns within date range
 * @param {Object} options
 * @param {string} options.startDate - Start date in YYYY-MM-DD format
 * @param {string} options.endDate - End date in YYYY-MM-DD format
 * @param {number|null} [options.clientId] - Client ID for filtering, null for all clients
 * @returns {Object} Object with turnsQuery and queryParams
 */
export function buildTurnsQuery({ startDate, endDate, clientId }) {
  let turnsQuery = `
    SELECT t.id, t.content, t.source_type, t.created_at, t.metadata,
           u.email
    FROM meetings.turns t
    LEFT JOIN client_mgmt.users u ON t.user_id = u.id
    WHERE t.created_at >= $1::timestamp 
      AND t.created_at <= $2::timestamp
  `;
  
  let queryParams = [startDate, endDate];
  
  if (clientId) {
    turnsQuery += ` AND t.client_id = $3`;
    queryParams.push(clientId);
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

/**
 * Generate AI summary using Anthropic API
 * @param {Object} options
 * @param {Object} options.anthropic - Anthropic API client instance
 * @param {string} options.prompt - The prompt to send to the AI
 * @param {number} [options.maxTokens=300] - Maximum tokens for the response
 * @returns {Promise<string>} Generated AI summary text
 */
export async function generateAISummary({ anthropic, prompt, maxTokens = 300 }) {
  if (!anthropic) {
    return 'AI summary generation not available - Claude API not configured.';
  }
  
  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }]
    });
    
    return message.content[0].text;
  } catch (error) {
    console.error('LLM Error generating summary:', error);
    return `Error generating summary: ${error.message}`;
  }
}
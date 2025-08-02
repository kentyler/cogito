import express from 'express';

const router = express.Router();

// Get available dates with conversation counts
router.get('/dates', async (req, res) => {
  try {
    const client_id = req.session?.user?.client_id;
    if (!client_id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await req.pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as turn_count
      FROM conversation.turns 
      WHERE client_id = $1
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `, [client_id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching transcript dates:', error);
    res.status(500).json({ error: 'Failed to fetch transcript dates' });
  }
});

// Get transcript data for a specific date
router.get('/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const client_id = req.session?.user?.client_id;
    
    if (!client_id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const result = await req.pool.query(`
      SELECT 
        id,
        prompt,
        response,
        created_at,
        conversation_id
      FROM conversation.turns 
      WHERE client_id = $1 
        AND DATE(created_at) = $2
      ORDER BY created_at ASC
    `, [client_id, date]);

    // Parse the response JSON for each turn
    const turns = result.rows.map(turn => ({
      ...turn,
      response: typeof turn.response === 'string' ? JSON.parse(turn.response) : turn.response
    }));

    res.json(turns);
  } catch (error) {
    console.error('Error fetching transcript for date:', error);
    res.status(500).json({ error: 'Failed to fetch transcript data' });
  }
});

export default router;
import express from 'express';
import { requireAuth } from '../config/middleware.js';

const router = express.Router();

// Get user's clients for extension use
router.get('/user/clients', requireAuth, async (req, res) => {
  try {
    const { user_id } = req.user;
    
    // Get all client associations for the authenticated user
    const clientsResult = await req.db.query(
      `SELECT 
        uc.client_id,
        uc.role,
        c.name
      FROM client_mgmt.user_clients uc
      JOIN client_mgmt.clients c ON uc.client_id = c.id
      WHERE uc.user_id = $1 AND uc.is_active = true
      ORDER BY c.name`,
      [user_id]
    );
    
    res.json(clientsResult.rows);
    
  } catch (error) {
    console.error('Get user clients error:', error);
    res.status(500).json({ error: 'Failed to get user clients' });
  }
});

// Query endpoint for extension
router.post('/query', requireAuth, async (req, res) => {
  try {
    const { query } = req.body;
    const clientId = req.headers['x-client-id'];
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    if (!clientId) {
      return res.status(400).json({ error: 'Client ID is required' });
    }
    
    // Verify user has access to this client
    const clientAccess = await req.db.query(
      `SELECT 1 FROM client_mgmt.user_clients uc
       WHERE uc.user_id = $1 AND uc.client_id = $2 AND uc.is_active = true`,
      [req.user.user_id, clientId]
    );
    
    if (clientAccess.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to client' });
    }
    
    // Perform full-text search across turns in the client's context
    const searchResult = await req.db.query(
      `SELECT 
        t.content,
        t.timestamp,
        t.speaker_name,
        m.title as meeting_title,
        ts_rank(to_tsvector('english', t.content), plainto_tsquery('english', $1)) as rank
      FROM meetings.turns t
      JOIN meetings.meetings m ON t.meeting_id = m.id
      WHERE m.client_id = $2 
        AND to_tsvector('english', t.content) @@ plainto_tsquery('english', $1)
      ORDER BY rank DESC, t.timestamp DESC
      LIMIT 10`,
      [query, clientId]
    );
    
    if (searchResult.rows.length === 0) {
      return res.json({ 
        response: `No relevant conversations found for "${query}". The search looked through all meetings and conversations in your Cogito database.` 
      });
    }
    
    // Format response with context from search results
    const contexts = searchResult.rows.map(row => 
      `From "${row.meeting_title}" (${row.speaker_name}, ${new Date(row.timestamp).toLocaleDateString()}): ${row.content}`
    ).join('\n\n');
    
    const response = `Based on your Cogito conversations, here's what I found about "${query}":\n\n${contexts}\n\nThis information comes from ${searchResult.rows.length} relevant conversation(s) in your database.`;
    
    res.json({ response });
    
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ error: 'Query failed' });
  }
});

export default router;
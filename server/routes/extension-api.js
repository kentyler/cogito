import express from 'express';
import { requireAuth } from './auth.js';
import { DatabaseAgent } from '../../lib/database-agent.js';

const router = express.Router();
const dbAgent = new DatabaseAgent();

// Ensure DatabaseAgent is connected
router.use(async (req, res, next) => {
  try {
    if (!dbAgent.connector.pool) {
      await dbAgent.connect();
    }
    next();
  } catch (error) {
    console.error('Database connection error in extension-api:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Get user's clients for extension use
router.get('/user/clients', requireAuth, async (req, res) => {
  try {
    const { user_id } = req.user;
    
    // Get all client associations for the authenticated user using DatabaseAgent
    const clients = await dbAgent.users.getUserClients(user_id);
    
    res.json(clients);
    
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
    
    // Verify user has access to this client using DatabaseAgent
    const hasAccess = await dbAgent.clients.checkUserClientAccess(req.user.user_id, parseInt(clientId));
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to client' });
    }
    
    // Perform full-text search using DatabaseAgent
    const searchResult = await dbAgent.searchTranscripts(query, {
      clientId: parseInt(clientId),
      limit: 10
    });
    
    if (searchResult.results.length === 0) {
      return res.json({ 
        response: `No relevant conversations found for "${query}". The search looked through all meetings and conversations in your Cogito database.` 
      });
    }
    
    // Format response with context from search results
    const contexts = searchResult.results.map(row => 
      `From "${row.meeting_name}" (${row.speaker || 'Unknown'}, ${new Date(row.timestamp).toLocaleDateString()}): ${row.content}`
    ).join('\n\n');
    
    const response = `Based on your Cogito conversations, here's what I found about "${query}":\n\n${contexts}\n\nThis information comes from ${searchResult.results.length} relevant conversation(s) in your database.`;
    
    res.json({ response });
    
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ error: 'Query failed' });
  }
});

export default router;
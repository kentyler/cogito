import express from 'express';
import { requireAuth } from './auth.js';
import { DatabaseAgent } from '../../lib/database-agent.js';
import { ApiResponses } from '../lib/api-responses.js';

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
    return ApiResponses.databaseError(res);
  }
});

// Get user's clients for extension use
router.get('/user/clients', requireAuth, async (req, res) => {
  try {
    const { user_id } = req.user;
    
    // Get all client associations for the authenticated user using DatabaseAgent
    const clients = await dbAgent.users.getUserClients(user_id);
    
    return ApiResponses.success(res, clients);
    
  } catch (error) {
    console.error('Get user clients error:', error);
    return ApiResponses.internalError(res, 'Failed to get user clients');
  }
});

// Query endpoint for extension
router.post('/query', requireAuth, async (req, res) => {
  try {
    const { query } = req.body;
    const clientId = req.headers['x-client-id'];
    
    if (!query) {
      return ApiResponses.badRequest(res, 'Query is required');
    }
    
    if (!clientId) {
      return ApiResponses.badRequest(res, 'Client ID is required');
    }
    
    // Verify user has access to this client using DatabaseAgent
    const hasAccess = await dbAgent.clients.checkUserClientAccess(req.user.user_id, parseInt(clientId));
    
    if (!hasAccess) {
      return ApiResponses.forbidden(res, 'Access denied to client');
    }
    
    // Perform full-text search using DatabaseAgent
    const searchResult = await dbAgent.searchTranscripts(query, {
      clientId: parseInt(clientId),
      limit: 10
    });
    
    if (searchResult.results.length === 0) {
      return ApiResponses.success(res, { 
        response: `No relevant conversations found for "${query}". The search looked through all meetings and conversations in your Cogito database.` 
      });
    }
    
    // Format response with context from search results
    const contexts = searchResult.results.map(row => 
      `From "${row.meeting_name}" (${row.speaker || 'Unknown'}, ${new Date(row.timestamp).toLocaleDateString()}): ${row.content}`
    ).join('\n\n');
    
    const response = `Based on your Cogito conversations, here's what I found about "${query}":\n\n${contexts}\n\nThis information comes from ${searchResult.results.length} relevant conversation(s) in your database.`;
    
    return ApiResponses.success(res, { response });
    
  } catch (error) {
    console.error('Query error:', error);
    return ApiResponses.internalError(res, 'Query failed');
  }
});

export default router;
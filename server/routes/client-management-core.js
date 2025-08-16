/**
 * Client Management Core Routes - Basic client operations
 * GET /clients - Get user's accessible clients
 * GET /available-clients - Get available clients for current user
 */

import express from 'express';
import { DatabaseAgent } from '../../lib/database-agent.js';

const router = express.Router();

// Get user's accessible clients
router.get('/clients', async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.session?.user?.user_id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const user_id = req.session.user.user_id;
    
    // Get all clients the user has access to
    const dbAgent = new DatabaseAgent();
    await dbAgent.connect();
    const clientsResult = await dbAgent.users.getUserClients(user_id);
    await dbAgent.close();
    
    res.json({
      success: true,
      clients: clientsResult
    });
    
  } catch (error) {
    console.error('Error fetching user clients:', error);
    res.status(500).json({ 
      error: 'Failed to fetch clients',
      message: error.message 
    });
  }
});

// Get available clients for current user
router.get('/available-clients', async (req, res) => {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { user_id } = req.session.user;
    
    // Get all client associations for the authenticated user
    const dbAgent2 = new DatabaseAgent();
    await dbAgent2.connect();
    const clientsResult = await dbAgent2.users.getUserClients(user_id);
    await dbAgent2.close();
    
    res.json({ 
      success: true,
      clients: clientsResult,
      current_client_id: req.session.user.client_id
    });
    
  } catch (error) {
    console.error('Get available clients error:', error);
    res.status(500).json({ error: 'Failed to get available clients' });
  }
});

export default router;
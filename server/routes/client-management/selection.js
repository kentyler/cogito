/**
 * Client Management Selection Routes - Client selection and switching
 * POST /select-client - Initial client selection or client switching
 * POST /switch-client - Switch client for authenticated users
 */

import express from 'express';
import { setupClientSession, logClientSelectionEvent } from '../lib/client-session-manager.js';

const router = express.Router();

// Client selection endpoint (for initial login with multiple clients OR switching clients)
router.post('/select-client', async (req, res) => {
  try {
    const { client_id } = req.body;
    
    if (!client_id) {
      return res.status(400).json({ error: 'Client ID required' });
    }
    
    // Check for either pending authentication or already logged in user
    let user_id, email;
    
    if (req.session.pendingUser) {
      // Initial client selection after login
      ({ user_id, email } = req.session.pendingUser);
    } else if (req.session.user) {
      // Switching clients for already logged-in user
      ({ user_id, email } = req.session.user);
      user_id = req.session.user.user_id || req.session.user.id;
    } else {
      return res.status(401).json({ error: 'Authentication required' });
    }
    // Setup client session with mini-horde support
    try {
      const sessionResult = await setupClientSession(req, user_id, email, client_id);
      const { client, parent_client_id } = sessionResult;
      
      // Determine event type before clearing pendingUser
      const isInitialSelection = !!req.session.pendingUser;
      
      // Clear pending user if it exists (for initial selection)
      if (req.session.pendingUser) {
        delete req.session.pendingUser;
      }
      
      req.session.save(async (err) => {
        if (err) {
          return res.status(500).json({ error: 'Session creation failed' });
        }
        
        // Log client selection event
        const eventType = isInitialSelection ? 'initial_client_selection' : 'client_selection';
        await logClientSelectionEvent(user_id, client, eventType, {
          userId: user_id,
          sessionId: req.sessionID,
          endpoint: `${req.method} ${req.path}`,
          ip: req.ip || req.connection?.remoteAddress,
          userAgent: req.get('User-Agent')
        });
        
        res.json({ 
          success: true, 
          user: { 
            user_id: user_id,
            email: email,
            client: client.client_name,
            client_name: client.client_name,
            client_id: client.client_id,
            role: client.role
          }
        });
      });
    } catch (meetingError) {
      console.error('Failed to create session meeting:', meetingError);
      return res.status(500).json({ error: 'Failed to initialize session' });
    }
  } catch (error) {
    console.error('Client selection error:', error);
    res.status(500).json({ error: 'Client selection failed' });
  }
});

// Switch client (for already authenticated users)
router.post('/switch-client', async (req, res) => {
  try {
    const { client_id } = req.body;
    
    if (!client_id) {
      return res.status(400).json({ error: 'Client ID required' });
    }
    
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const { user_id, email } = req.session.user;
    
    // Verify user has access to this client and get parent_client_id
    const dbAgent = new DatabaseAgent();
    await dbAgent.connect();
    const client = await dbAgent.users.verifyClientAccess(user_id, client_id);
    
    // Get parent_client_id for mini-horde support
    let parent_client_id = null;
    if (client) {
      const clientDetails = await dbAgent.clients.getClientById(client_id);
      parent_client_id = clientDetails?.parent_client_id || null;
    }
    
    await dbAgent.close();
    
    if (!client) {
      return res.status(403).json({ error: 'Access denied to selected client' });
    }
    
    // Create new session meeting for the new client
    try {
      const meeting_id = await createSessionMeeting(req.db, user_id, client.client_id);
      
      // Update session with new client including parent_client_id for mini-horde support
      req.session.user = {
        user_id: user_id,
        email: email,
        client_id: client.client_id,
        client_name: client.client_name,
        role: client.role
      };
      req.session.parent_client_id = parent_client_id;
      req.session.meeting_id = meeting_id;
      
      req.session.save(async (err) => {
        if (err) {
          return res.status(500).json({ error: 'Session update failed' });
        }
        
        // Log client switch event
        try {
          const dbAgent = new DatabaseAgent();
          await dbAgent.connect();
          await dbAgent.logClientEvent('client_switch', {
            client_id: client.client_id,
            client_name: client.client_name,
            user_id: user_id,
            role: client.role,
            previous_client_id: req.session.user?.client_id || null
          }, {
            userId: user_id,
            sessionId: req.sessionID,
            endpoint: `${req.method} ${req.path}`,
            ip: req.ip || req.connection?.remoteAddress,
            userAgent: req.get('User-Agent')
          });
          await dbAgent.close();
        } catch (logError) {
          console.error('Failed to log client switch:', logError);
        }
        
        res.json({ 
          success: true, 
          user: { 
            email: email,
            client: client.client_name,
            role: client.role
          }
        });
      });
    } catch (meetingError) {
      console.error('Failed to create session meeting for client switch:', meetingError);
      return res.status(500).json({ error: 'Failed to switch client' });
    }
  } catch (error) {
    console.error('Client switch error:', error);
    res.status(500).json({ error: 'Client switch failed' });
  }
});

export default router;
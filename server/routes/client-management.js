import express from 'express';
import { createSessionMeeting } from '../lib/session-meeting.js';
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
    const clientsResult = await req.db.query(
      `SELECT 
        c.id as client_id,
        c.name as client_name,
        uc.role
      FROM client_mgmt.user_clients uc
      JOIN client_mgmt.clients c ON uc.client_id = c.id
      WHERE uc.user_id = $1 AND uc.is_active = true
      ORDER BY c.name`,
      [user_id]
    );
    
    res.json({
      success: true,
      clients: clientsResult.rows
    });
    
  } catch (error) {
    console.error('Error fetching user clients:', error);
    res.status(500).json({ 
      error: 'Failed to fetch clients',
      message: error.message 
    });
  }
});

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
    
    // Continue with user_id and email...
    
    // Verify user has access to this client
    const clientResult = await req.db.query(
      `SELECT 
        uc.client_id,
        uc.role,
        c.name as client_name
      FROM client_mgmt.user_clients uc
      JOIN client_mgmt.clients c ON uc.client_id = c.id
      WHERE uc.user_id = $1 AND uc.client_id = $2 AND uc.is_active = true`,
      [user_id, client_id]
    );
    
    if (clientResult.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to selected client' });
    }
    
    const client = clientResult.rows[0];
    
    // Create session meeting
    try {
      const meeting_id = await createSessionMeeting(req.db, user_id, client.client_id);
      
      // Set up full session
      req.session.user = {
        user_id: user_id,
        id: user_id,  // Some code uses .id
        email: email,
        client_id: client.client_id,
        client_name: client.client_name,
        role: client.role
      };
      req.session.meeting_id = meeting_id;
      
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
        try {
          const dbAgent = new DatabaseAgent();
          await dbAgent.connect();
          const eventType = isInitialSelection ? 'initial_client_selection' : 'client_selection';
          await dbAgent.logClientEvent(eventType, {
            client_id: client.client_id,
            client_name: client.client_name,
            user_id: user_id,
            role: client.role
          }, {
            userId: user_id,
            sessionId: req.sessionID,
            endpoint: `${req.method} ${req.path}`,
            ip: req.ip || req.connection?.remoteAddress,
            userAgent: req.get('User-Agent')
          });
          await dbAgent.close();
        } catch (logError) {
          console.error('Failed to log client selection:', logError);
        }
        
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

// Get available clients for current user
router.get('/available-clients', async (req, res) => {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { user_id } = req.session.user;
    
    // Get all client associations for the authenticated user
    const clientsResult = await req.db.query(
      `SELECT 
        uc.client_id,
        uc.role,
        c.name as client_name
      FROM client_mgmt.user_clients uc
      JOIN client_mgmt.clients c ON uc.client_id = c.id
      WHERE uc.user_id = $1 AND uc.is_active = true
      ORDER BY c.name`,
      [user_id]
    );
    
    res.json({ 
      success: true,
      clients: clientsResult.rows,
      current_client_id: req.session.user.client_id
    });
    
  } catch (error) {
    console.error('Get available clients error:', error);
    res.status(500).json({ error: 'Failed to get available clients' });
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
    
    // Verify user has access to this client
    const clientResult = await req.db.query(
      `SELECT 
        uc.client_id,
        uc.role,
        c.name as client_name
      FROM client_mgmt.user_clients uc
      JOIN client_mgmt.clients c ON uc.client_id = c.id
      WHERE uc.user_id = $1 AND uc.client_id = $2 AND uc.is_active = true`,
      [user_id, client_id]
    );
    
    if (clientResult.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to selected client' });
    }
    
    const client = clientResult.rows[0];
    
    // Create new session meeting for the new client
    try {
      const meeting_id = await createSessionMeeting(req.db, user_id, client.client_id);
      
      // Update session with new client
      req.session.user = {
        user_id: user_id,
        email: email,
        client_id: client.client_id,
        client_name: client.client_name,
        role: client.role
      };
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
import express from 'express';
import bcrypt from 'bcrypt';
import { createSessionMeeting } from '../lib/session-meeting.js';
import { DatabaseAgent } from '../../lib/database-agent.js';

const router = express.Router();

// Authentication middleware
export function requireAuth(req, res, next) {
  // Debug logging
  console.log('Auth check - Session:', req.session ? 'exists' : 'missing');
  console.log('Auth check - Session user:', req.session?.user);
  console.log('Auth check - Headers:', {
    'x-user-id': req.headers['x-user-id'],
    'x-user-email': req.headers['x-user-email']
  });
  
  // Check session first (preserves existing functionality)
  if (req.session && req.session.user) {
    // Set up req.user for compatibility
    req.user = {
      id: req.session.user.user_id || req.session.user.id,
      email: req.session.user.email
    };
    return next();
  }
  
  // Fallback to headers from cogito-repl proxy (new functionality)
  if (req.headers['x-user-id'] && req.headers['x-user-email']) {
    req.user = {
      id: parseInt(req.headers['x-user-id']),
      email: req.headers['x-user-email']
    };
    return next();
  }
  
  console.log('Auth failed - returning 401');
  return res.status(401).json({ error: 'Authentication required' });
}

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    // Initialize DatabaseAgent for this request
    const dbAgent = new DatabaseAgent();
    await dbAgent.connect();
    
    // Authenticate user using DatabaseAgent (handles its own event logging)
    const authenticatedUser = await dbAgent.users.authenticate(email, password);
    
    if (!authenticatedUser) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Get client associations using DatabaseAgent
    const clients = await dbAgent.users.getUserClients(authenticatedUser.id);
    
    if (clients.length === 0) {
      return res.status(403).json({ error: 'No active client access' });
    }
    
    if (clients.length === 1) {
      // Auto-select the only client and create session meeting
      try {
        const meeting_id = await createSessionMeeting(req.db, authenticatedUser.id, clients[0].client_id);
        
        req.session.user = {
          user_id: authenticatedUser.id,
          id: authenticatedUser.id,  // Some code uses .id
          email: authenticatedUser.email,
          client_id: clients[0].client_id,
          client_name: clients[0].client_name,
          role: clients[0].role
        };
        req.session.meeting_id = meeting_id;
        
        req.session.save((err) => {
          if (err) {
            return res.status(500).json({ error: 'Session creation failed' });
          }
          
          res.json({ 
            success: true, 
            user: { 
              email: authenticatedUser.email,
              client: clients[0].client_name
            }
          });
        });
      } catch (meetingError) {
        console.error('Failed to create session meeting:', meetingError);
        return res.status(500).json({ error: 'Failed to initialize session' });
      }
    } else {
      // Multiple clients - need selection
      req.session.pendingUser = {
        user_id: authenticatedUser.id,
        email: authenticatedUser.email
      };
      
      req.session.save((err) => {
        if (err) {
          return res.status(500).json({ error: 'Session creation failed' });
        }
        
        res.json({ 
          success: true,
          requiresClientSelection: true,
          clients: clients
        });
      });
    }
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  } finally {
    await dbAgent?.close();
  }
});

// Check auth endpoint - validates if session is still valid
router.get('/check', requireAuth, (req, res) => {
  res.json({ 
    authenticated: true, 
    user: {
      id: req.user.id,
      email: req.user.email
    }
  });
});

// Logout endpoint
router.post('/logout', async (req, res) => {
  try {
    const sessionUser = req.session?.user;
    
    // Initialize DatabaseAgent for event logging
    const dbAgent = new DatabaseAgent();
    await dbAgent.connect();
    
    // Log logout event before destroying session
    if (sessionUser) {
      await dbAgent.logAuthEvent('logout', {
        email: sessionUser.email,
        user_id: sessionUser.user_id || sessionUser.id,
        client_id: sessionUser.client_id,
        client_name: sessionUser.client_name,
        session_duration_ms: Date.now() - (req.session.cookie.originalMaxAge || 0)
      }, {
        userId: sessionUser.user_id || sessionUser.id,
        sessionId: req.sessionID,
        endpoint: `${req.method} ${req.path}`,
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('User-Agent')
      });
    }
    
    // Destroy session
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
        return res.status(500).json({ error: 'Logout failed' });
      }
      
      res.clearCookie('connect.sid'); // Clear session cookie
      res.json({ success: true, message: 'Logged out successfully' });
    });
    
    await dbAgent.close();
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

export default router;
import express from 'express';
import bcrypt from 'bcrypt';
import { createSessionMeeting } from '../lib/session-meeting.js';

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
    
    // Find all users with this email (could be multiple due to duplicate emails)
    const userResult = await req.db.query(
      'SELECT id, email, password_hash FROM client_mgmt.users WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password against all matching users
    let authenticatedUser = null;
    for (const user of userResult.rows) {
      if (!user.password_hash) continue;
      
      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      if (passwordMatch) {
        authenticatedUser = user;
        break;
      }
    }
    
    if (!authenticatedUser) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Get client associations for the authenticated user
    const clientsResult = await req.db.query(
      `SELECT 
        uc.client_id,
        uc.role,
        c.name as client_name
      FROM client_mgmt.user_clients uc
      JOIN client_mgmt.clients c ON uc.client_id = c.id
      WHERE uc.user_id = $1 AND uc.is_active = true
      ORDER BY c.name`,
      [authenticatedUser.id]
    );
    
    const clients = clientsResult.rows;
    
    if (clients.length === 0) {
      return res.status(403).json({ error: 'No active client access' });
    }
    
    if (clients.length === 1) {
      // Auto-select the only client and create session meeting
      try {
        const meeting_id = await createSessionMeeting(req.db, authenticatedUser.id, clients[0].client_id);
        
        req.session.user = {
          user_id: authenticatedUser.id,
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
  }
});

export default router;
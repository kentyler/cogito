import express from 'express';

const router = express.Router();

// Client selection endpoint
router.post('/select-client', async (req, res) => {
  try {
    const { client_id } = req.body;
    
    if (!client_id) {
      return res.status(400).json({ error: 'Client ID required' });
    }
    
    // Check if user has pending authentication
    if (!req.session.pendingUser) {
      return res.status(401).json({ error: 'No pending authentication' });
    }
    
    const { user_id, email } = req.session.pendingUser;
    
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
    
    // Set up full session
    req.session.user = {
      user_id: user_id,
      email: email,
      client_id: client.client_id,
      client_name: client.client_name,
      role: client.role
    };
    
    // Clear pending user
    delete req.session.pendingUser;
    
    req.session.save((err) => {
      if (err) {
        return res.status(500).json({ error: 'Session creation failed' });
      }
      res.json({ 
        success: true, 
        user: { 
          email: email,
          client: client.client_name
        }
      });
    });
    
  } catch (error) {
    console.error('Client selection error:', error);
    res.status(500).json({ error: 'Client selection failed' });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true });
  });
});

// Health check endpoint for browser extension
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    server: 'cogito-mcp',
    timestamp: new Date().toISOString()
  });
});

// Auth status endpoint
router.get('/auth-status', (req, res) => {
  console.log('Auth status check - Session:', req.session ? 'exists' : 'missing');
  console.log('Auth status check - Session user:', req.session?.user);
  console.log('Auth status check - Pending user:', req.session?.pendingUser);
  
  if (req.session && req.session.user) {
    res.json({ 
      authenticated: true, 
      user: { 
        email: req.session.user.email,
        client: req.session.user.client_name,
        role: req.session.user.role
      }
    });
  } else if (req.session && req.session.pendingUser) {
    res.json({ 
      authenticated: false,
      pendingClientSelection: true
    });
  } else {
    res.json({ authenticated: false });
  }
});

export default router;
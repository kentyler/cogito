import express from 'express';

const router = express.Router();

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
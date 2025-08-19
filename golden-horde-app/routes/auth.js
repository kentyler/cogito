/**
 * Golden Horde Authentication Routes
 * Simple auth system for Golden Horde interface
 */

import express from 'express';

const router = express.Router();

// Simple email/password login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    // For Golden Horde, we'll accept any email with the password "goldenhorde"
    // In production, you'd want proper user validation
    if (password === 'goldenhorde') {
      // Create simple session
      req.session.user = {
        email: email,
        name: email.split('@')[0], // Use email prefix as name
        avatar: 'golden_horde_collective',
        loginTime: new Date().toISOString()
      };
      
      console.log(`🏹 Golden Horde login: ${email}`);
      
      res.json({ 
        success: true, 
        message: 'Welcome to the collective',
        user: req.session.user
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
    
  } catch (error) {
    console.error('Golden Horde login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Check authentication status
router.get('/status', (req, res) => {
  if (req.session && req.session.user) {
    res.json({ 
      authenticated: true, 
      user: req.session.user 
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Logout
router.post('/logout', (req, res) => {
  const userEmail = req.session?.user?.email;
  
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    
    console.log(`🏹 Golden Horde logout: ${userEmail}`);
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

export default router;
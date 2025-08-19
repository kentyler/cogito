/**
 * Golden Horde Chat Routes
 * Handles chat API endpoints for Golden Horde interface
 */

import express from 'express';
import CogitoClient from '../lib/cogito-client.js';

const router = express.Router();
const cogito = new CogitoClient();

// Middleware to require authentication
function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
}

// Send message to Golden Horde Collective
router.post('/message', requireAuth, async (req, res) => {
  try {
    const { message } = req.body;
    const user = req.session.user;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    console.log(`🏹 Golden Horde message from ${user.email}: ${message.substring(0, 100)}...`);
    
    // Send to main Cogito with Golden Horde context
    const result = await cogito.sendMessage(message, {
      email: user.email,
      name: user.name
    });
    
    if (result.success) {
      res.json({
        response: result.response,
        metadata: result.metadata
      });
    } else {
      // Return fallback response but don't fail the request
      res.json({
        response: result.response,
        metadata: result.metadata,
        warning: 'Using fallback response'
      });
    }
    
  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ 
      error: 'Message processing failed',
      response: "The collective encounters an unexpected disruption. Please try your message again."
    });
  }
});

// Get conversation history (placeholder for future implementation)
router.get('/history', requireAuth, (req, res) => {
  // For now, return empty history
  // In the future, could store conversation history in a simple JSON file or database
  res.json({
    conversations: [],
    message: "The collective's memory spans beyond individual conversations"
  });
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'golden-horde-chat',
    cogitoConnection: 'checking...'
  });
  
  // Async check main Cogito health
  cogito.healthCheck().then(healthy => {
    console.log(`🏹 Main Cogito health: ${healthy ? 'connected' : 'disconnected'}`);
  });
});

export default router;
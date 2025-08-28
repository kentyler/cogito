import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAuth } from './auth/middleware.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware to check if user has Golden Horde access
function requireGoldenHordeAccess(req, res, next) {
  const user = req.user || req.session?.user;
  
  console.log('🔍 Golden Horde middleware check:', {
    hasUser: !!user,
    sessionKeys: Object.keys(req.session || {}),
    userEmail: user?.email
  });
  
  if (!user) {
    console.log('🔍 No user found, serving login page');
    // Serve Golden Horde login page instead of redirecting
    return res.sendFile(path.join(__dirname, '../../public/goldenhorde/login.html'));
  }
  
  // Check if user has Golden Horde access (you can add role-based access here)
  // For now, allow all authenticated users
  console.log(`Golden Horde access granted to user: ${user.email}`);
  next();
}

/**
 * Serve the chat interface
 */
router.get('/', requireGoldenHordeAccess, (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/goldenhorde/index.html'));
});

// Explicit login route
router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/goldenhorde/login.html'));
});

/**
 * Serve chat assets (CSS, JS) with cache headers
 */
router.get('/css/:filename', (req, res) => {
  const filename = req.params.filename;
  
  // Security check - only allow CSS files
  if (!filename.endsWith('.css')) {
    return res.status(404).send('Not found');
  }
  
  res.setHeader('Content-Type', 'text/css');
  res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour cache
  res.sendFile(path.join(__dirname, '../../public/goldenhorde/css', filename));
});

router.get('/js/:filename', (req, res) => {
  const filename = req.params.filename;
  
  // Security check - only allow JS files
  if (!filename.endsWith('.js')) {
    return res.status(404).send('Not found');
  }
  
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour cache
  res.sendFile(path.join(__dirname, '../../public/goldenhorde/js', filename));
});

/**
 * Chat API endpoint - simplified conversation
 */
router.post('/api/message', requireGoldenHordeAccess, async (req, res) => {
  try {
    const { message, context } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // TODO: Integrate with existing conversation system
    // For now, return a simple response
    const response = {
      message: `Echo: ${message}`,
      timestamp: new Date().toISOString(),
      model: 'demo'
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get available prompt templates
 */
router.get('/api/prompts', requireGoldenHordeAccess, (req, res) => {
  // Return built-in prompt templates
  const templates = {
    analysis: [
      {
        id: 'data-analysis',
        title: 'Data Analysis',
        prompt: 'Analyze this data and identify key patterns: [PASTE DATA]',
        category: 'analysis'
      },
      {
        id: 'compare-options',
        title: 'Compare Options',
        prompt: 'Compare [OPTION A] vs [OPTION B]. What are the pros and cons of each?',
        category: 'analysis'
      }
    ],
    writing: [
      {
        id: 'email-draft',
        title: 'Email Draft',
        prompt: 'Write a professional email about [TOPIC] to [RECIPIENT].',
        category: 'writing'
      },
      {
        id: 'summarize',
        title: 'Summarize',
        prompt: 'Summarize this text in 3 key bullet points: [PASTE TEXT]',
        category: 'writing'
      }
    ]
  };
  
  res.json(templates);
});

/**
 * Health check for chat interface
 */
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'chat-interface',
    timestamp: new Date().toISOString()
  });
});

export default router;
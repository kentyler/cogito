import 'dotenv/config';
import express from 'express';
import { Pool } from 'pg';
import Anthropic from '@anthropic-ai/sdk';
import bcrypt from 'bcrypt';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import path from 'path';
import { WebSocketServer } from 'ws';
import http from 'http';
import nodemailer from 'nodemailer';
import multer from 'multer';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
// Use global fetch available in Node.js 18+
import turnProcessorPkg from './turn-processor-wrapper.cjs';
import similarityOrchestratorPkg from './similarity-orchestrator-wrapper.cjs';
const { createTurnProcessor } = turnProcessorPkg;
const { createSimilarityOrchestrator } = similarityOrchestratorPkg;

// Import file upload service
import { fileUploadService } from './lib/file-upload.js';
import { v4 as uuidv4 } from 'uuid';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pgSession = connectPgSimple(session);

// Note: Transcript processing agents will be imported dynamically since they're ES modules

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/temp/', // Temporary storage
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Max 10 files per request
  },
  fileFilter: (req, file, cb) => {
    // Accept text files, PDFs, and common document formats
    const allowedTypes = [
      'text/plain',
      'text/markdown',
      'application/pdf',
      'application/json',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not supported'));
    }
  }
});

// Initialize similarity orchestrator (will be set after async initialization)
let similarityOrchestrator;

// Initialize transcript processing agents (ES modules)
let TranscriptBufferAgent;
let TurnEmbeddingAgent;
let SpeakerProfileAgent;
let embeddingAgent;
const meetingBuffers = new Map(); // blockMeetingId -> TranscriptBufferAgent
const meetingSpeakerAgents = new Map(); // blockMeetingId -> SpeakerProfileAgent

const app = express();

// Trust proxy for production deployment
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Initialize turn processor (will be set after async initialization)
let turnProcessor;

// Initialize PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Set search path for schema access
pool.on('connect', (client) => {
  client.query('SET search_path = public, conversation, client_mgmt');
});

// Email transporter will be initialized when needed
let emailTransporter = null;

// Initialize email transporter with fallback methods
async function getEmailTransporter() {
  if (emailTransporter) {
    return emailTransporter;
  }
  
  // Try Resend first if configured (recommended)
  if (process.env.RESEND_API_KEY) {
    try {
      const resendTransporter = nodemailer.createTransport({
        host: 'smtp.resend.com',
        port: 465,
        secure: true,
        auth: {
          user: 'resend',
          pass: process.env.RESEND_API_KEY
        }
      });
      
      await resendTransporter.verify();
      console.log('✅ Resend email service configured successfully');
      emailTransporter = resendTransporter;
      return emailTransporter;
    } catch (error) {
      console.error('❌ Resend configuration failed:', error.message);
      console.error('❌ Check: 1) API key is correct 2) Domain is verified in Resend dashboard 3) FROM address uses verified domain');
    }
  }
  
  // Try Gmail SMTP if configured (requires app password)
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    try {
      const gmailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD
        }
      });
      
      await gmailTransporter.verify();
      console.log('✅ Gmail SMTP configured successfully');
      emailTransporter = gmailTransporter;
      return emailTransporter;
    } catch (error) {
      console.error('❌ Gmail SMTP configuration failed:', error);
    }
  }
  
  // Try direct SMTP second
  try {
    const directTransporter = nodemailer.createTransport({
      name: process.env.RENDER_EXTERNAL_URL || 'cogito-meetings.onrender.com',
      direct: true,
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000
    });
    
    await directTransporter.verify();
    console.log('📧 Using direct SMTP transport');
    emailTransporter = directTransporter;
    return emailTransporter;
  } catch (error) {
    console.log('📧 Direct SMTP failed:', error.message);
  }
  
  console.log('📧 All configured email services failed - falling back to logging only');
  // Ethereal removed - skip to logging fallback
  
  // Final fallback to logging
  emailTransporter = {
    sendMail: async (mailOptions) => {
      console.log('\n📧 ============ EMAIL LOGGED ============');
      console.log(`From: ${mailOptions.from}`);
      console.log(`To: ${mailOptions.to}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log(`Content Type: ${mailOptions.html ? 'HTML' : 'Text'}`);
      console.log(`Content Length: ${(mailOptions.html || mailOptions.text || '').length} characters`);
      console.log('📧 ======================================\n');
      
      return { 
        messageId: `logged-mail-${Date.now()}@localhost`,
        accepted: [mailOptions.to],
        rejected: [],
        envelope: {
          from: mailOptions.from,
          to: [mailOptions.to]
        }
      };
    },
    
    verify: () => {
      console.log('📧 Logging mail service verified');
      return Promise.resolve(true);
    }
  };
  
  return emailTransporter;
}

// Initialize Claude/Anthropic
let anthropic;
if (process.env.ANTHROPIC_API_KEY) {
  anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });
  console.log('✅ Claude/Anthropic initialized successfully');
} else {
  console.warn('⚠️  ANTHROPIC_API_KEY not found, Claude features disabled');
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add CORS for browser extension
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// CORS configuration for production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && origin.includes('cogito-meetings.onrender.com')) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    }
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });
}

// Custom middleware to handle empty JSON bodies
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    // Handle JSON parsing errors by setting an empty body
    req.body = {};
    return next();
  }
  next(err);
});

// Session middleware
app.use(session({
  store: new pgSession({
    pool: pool,
    tableName: 'user_sessions'
  }),
  secret: process.env.SESSION_SECRET || 'cogito-repl-secret-key',
  resave: false,
  saveUninitialized: false,
  name: 'cogito.sid', // Custom session name
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for cross-origin in production
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    domain: process.env.COOKIE_DOMAIN || undefined // Allow setting custom domain if needed
  }
}));

// Serve static files
app.use(express.static('public'));

// Serve bot manager at /bot-manager
app.use('/bot-manager', express.static('public/bot-manager'));

// Authentication middleware
function requireAuth(req, res, next) {
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
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    // Find all users with this email (could be multiple due to duplicate emails)
    const userResult = await pool.query(
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
    const clientsResult = await pool.query(
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
      // Auto-select the only client
      req.session.user = {
        user_id: authenticatedUser.id,
        email: authenticatedUser.email,
        client_id: clients[0].client_id,
        client_name: clients[0].client_name,
        role: clients[0].role
      };
      
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

// Client selection endpoint
app.post('/api/select-client', async (req, res) => {
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
    const clientResult = await pool.query(
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
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true });
  });
});

// Auth status endpoint
// Health check endpoint for browser extension
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    server: 'cogito-mcp',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/auth-status', (req, res) => {
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

// Conversational REPL endpoint
app.post('/api/conversational-turn', requireAuth, async (req, res) => {
  try {
    const { content, conversation_id, context } = req.body;
    const user_id = req.session.user.user_id;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    // Store the user's prompt as a turn with embedding
    const userTurn = await turnProcessor.createTurn({
      participant_id: user_id,
      content: content,
      source_type: 'conversational-repl-user',
      metadata: { conversation_id }
    });
    
    // Generate LLM response
    let llmResponse;
    try {
      if (anthropic) {
        const prompt = `You are powering a Conversational REPL that generates executable UI components.

CONVERSATIONAL TOPOLOGY ASSESSMENT:
Before responding, consider if there are multiple genuinely different conversation territories this prompt could lead to. Present multiple responses when:
- Different paths lead to fundamentally different conversation territories
- The alternatives represent substantially different approaches to understanding or solving
- The unstated possibilities might be more valuable than the obvious response

Present single response when:
- Multiple paths exist but converge toward similar insights
- The alternatives are minor variations rather than true alternatives

When responding, output valid ClojureScript data structures:

SINGLE RESPONSE (most cases):
{:response-type :text
 :content "Your response here"}

MULTIPLE RESPONSES (when genuine alternatives exist):
{:response-type :response-set
 :alternatives [{:id "implementation"
                 :summary "Direct implementation approach"
                 :response-type :text
                 :content "Here's how to implement..."}
                {:id "exploration"
                 :summary "Research and analysis approach"
                 :response-type :list
                 :items ["First examine..." "Then investigate..."]}
                {:id "clarification"
                 :summary "Clarifying questions approach"
                 :response-type :text
                 :content "Before proceeding, I need to understand..."}]}

Other available response types: :list, :spreadsheet, :diagram, :email

User prompt: "${content}"

${context && context.responding_to_alternative ? 
  `CONTEXT: User is responding to alternative "${context.responding_to_alternative.alternative_summary}" (${context.responding_to_alternative.alternative_id}) from a previous response set.` : 
  ''}

Assess whether multiple conversation territories exist, then respond appropriately.`;

        const message = await anthropic.messages.create({
          model: "claude-3-haiku-20240307",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }]
        });
        
        let responseText = message.content[0].text;
        
        // Simple validation
        if (responseText.includes(':response-type')) {
          llmResponse = responseText.trim();
        } else {
          llmResponse = `{:response-type :text :content "${responseText.replace(/"/g, '\\"')}"}`;
        }
        
      } else {
        llmResponse = `{:response-type :text :content "Claude not available - check ANTHROPIC_API_KEY"}`;
      }
    } catch (llmError) {
      console.error('LLM Error:', llmError);
      llmResponse = `{:response-type :text :content "Error generating response: ${llmError.message}"}`;
    }
    
    // Check if this is a response-set (multiple alternatives)
    let llmTurn;
    if (llmResponse.includes(':response-set')) {
      // Parse the response to extract alternatives
      try {
        // For now, store the complete response-set as a single turn
        // The frontend will handle parsing and navigation
        llmTurn = await turnProcessor.createTurn({
          participant_id: user_id,
          content: llmResponse,
          source_type: 'conversational-repl-llm',
          source_turn_id: userTurn.turn_id,
          metadata: { 
            conversation_id, 
            user_turn_id: userTurn.turn_id,
            response_type: 'response-set',
            has_alternatives: true
          }
        });
      } catch (parseError) {
        console.error('Error storing response-set:', parseError);
        // Fallback to single response
        llmTurn = await turnProcessor.createTurn({
          participant_id: user_id,
          content: llmResponse,
          source_type: 'conversational-repl-llm',
          source_turn_id: userTurn.turn_id,
          metadata: { 
            conversation_id, 
            user_turn_id: userTurn.turn_id,
            response_type: 'clojure-data'
          }
        });
      }
    } else {
      // Store single response as before
      llmTurn = await turnProcessor.createTurn({
        participant_id: user_id,
        content: llmResponse,
        source_type: 'conversational-repl-llm',
        source_turn_id: userTurn.turn_id,
        metadata: { 
          conversation_id, 
          user_turn_id: userTurn.turn_id,
          response_type: 'clojure-data'
        }
      });
    }
    
    res.json({
      id: llmTurn.turn_id,
      user_turn_id: userTurn.turn_id,
      prompt: content,
      response: llmResponse,
      conversation_id: conversation_id || userTurn.turn_id,
      created_at: llmTurn.created_at
    });
    
  } catch (error) {
    console.error('Conversational REPL error:', error);
    res.status(500).json({ error: 'Failed to process conversational turn' });
  }
});

// Semantic search endpoint
app.post('/api/search-turns', requireAuth, async (req, res) => {
  try {
    const { query, limit = 20, minSimilarity = 0.5 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    const results = await turnProcessor.searchTurns(query, limit, minSimilarity);
    
    res.json({
      query,
      results,
      count: results.length
    });
    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search turns' });
  }
});

// Find similar turns endpoint
app.get('/api/similar-turns/:turnId', requireAuth, async (req, res) => {
  try {
    const { turnId } = req.params;
    const { limit = 10, minSimilarity = 0.7 } = req.query;
    
    const results = await turnProcessor.findSimilarTurns(
      turnId, 
      parseInt(limit), 
      parseFloat(minSimilarity)
    );
    
    res.json({
      source_turn_id: turnId,
      similar_turns: results,
      count: results.length
    });
    
  } catch (error) {
    console.error('Similar turns error:', error);
    res.status(500).json({ error: 'Failed to find similar turns' });
  }
});

// Similarity analysis endpoints
app.get('/api/analyze-block/:blockId', requireAuth, async (req, res) => {
  try {
    const { blockId } = req.params;
    const { minContentLength, sourceTypes } = req.query;
    
    const options = {};
    if (minContentLength) options.minContentLength = parseInt(minContentLength);
    if (sourceTypes) options.sourceTypes = sourceTypes.split(',');
    
    const analysis = await similarityOrchestrator.analyzeBlock(blockId, options);
    res.json(analysis);
    
  } catch (error) {
    console.error('Block analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze block' });
  }
});

app.get('/api/analyze-turn/:turnId', requireAuth, async (req, res) => {
  try {
    const { turnId } = req.params;
    const { contextSize = 50, minSimilarity = 0.5 } = req.query;
    
    const analysis = await similarityOrchestrator.analyzeTurnSimilarities(turnId, {
      contextSize: parseInt(contextSize),
      minSimilarity: parseFloat(minSimilarity)
    });
    
    res.json(analysis);
    
  } catch (error) {
    console.error('Turn analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze turn' });
  }
});

app.get('/api/available-blocks', requireAuth, async (req, res) => {
  try {
    const blocks = await similarityOrchestrator.getAvailableBlocks();
    res.json(blocks);
  } catch (error) {
    console.error('Available blocks error:', error);
    res.status(500).json({ error: 'Failed to get available blocks' });
  }
});

// Get meeting list with detailed information
app.get('/api/meetings', requireAuth, async (req, res) => {
  try {
    const query = `
      SELECT 
        b.block_id,
        b.name as block_name,
        b.created_at,
        b.metadata,
        bm.meeting_url,
        bm.started_at as meeting_start_time,
        bm.ended_at as meeting_end_time,
        bm.status,
        COUNT(t.turn_id)::integer as turn_count,
        COUNT(CASE WHEN t.content_embedding IS NOT NULL THEN 1 END)::integer as embedded_count,
        COUNT(DISTINCT t.participant_id)::integer as participant_count,
        array_agg(DISTINCT p.name) FILTER (WHERE p.name IS NOT NULL) as participant_names,
        MIN(t.created_at) as first_turn_time,
        MAX(t.created_at) as last_turn_time
      FROM conversation.blocks b
      LEFT JOIN conversation.block_meetings bm ON b.block_id = bm.block_id
      LEFT JOIN conversation.turns t ON b.block_id = t.block_id
      LEFT JOIN conversation.participants p ON t.participant_id = p.id
      WHERE b.block_type = 'meeting' OR bm.block_id IS NOT NULL
      GROUP BY b.block_id, b.name, b.created_at, b.metadata, bm.meeting_url, bm.started_at, bm.ended_at, bm.status
      ORDER BY b.created_at DESC
    `;
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
});

// Get meeting embeddings for semantic map
app.get('/api/meetings/:blockId/embeddings', requireAuth, async (req, res) => {
  try {
    const { blockId } = req.params;
    
    // First, get the dimensionality reduction to 2D using t-SNE or PCA approximation
    // For now, we'll use a simple approach - later this could use proper t-SNE
    // Get embeddings and use proper similarity-based clustering
    const query = `
      SELECT 
        t.turn_id,
        t.content,
        t.participant_id,
        t.created_at,
        t.source_type,
        p.name as participant_name,
        t.content_embedding
      FROM conversation.turns t
      LEFT JOIN conversation.participants p ON t.participant_id = p.id
      WHERE t.block_id = $1
        AND t.content_embedding IS NOT NULL
      ORDER BY t.timestamp
    `;
    
    const result = await pool.query(query, [blockId]);
    
    if (result.rows.length === 0) {
      return res.json({ embeddings: [], message: 'No embeddings found for this meeting' });
    }
    
    // Parse embedding vectors and compute similarity-based positions
    console.log('First embedding sample:', result.rows[0]?.content_embedding?.toString().substring(0, 100));
    
    const turns = result.rows.map((row, idx) => {
      let embedding;
      try {
        // Handle different embedding formats
        if (typeof row.content_embedding === 'string') {
          // Clean up the string format more carefully
          const cleanString = row.content_embedding.replace(/^\[|\]$/g, '').trim();
          embedding = cleanString.split(',').map(val => {
            const parsed = parseFloat(val.trim());
            return isNaN(parsed) ? 0 : parsed;
          });
        } else if (Array.isArray(row.content_embedding)) {
          embedding = row.content_embedding.map(val => isNaN(val) ? 0 : val);
        } else {
          // Try to handle pgvector format
          embedding = Array.from(row.content_embedding).map(val => isNaN(val) ? 0 : val);
        }
        
        if (idx === 0) {
          console.log('Parsed embedding length:', embedding.length);
          console.log('First 10 values:', embedding.slice(0, 10));
        }
      } catch (e) {
        console.error('Error parsing embedding:', e);
        embedding = new Array(1536).fill(0); // Use zeros instead of random
      }
      
      return {
        turn_id: row.turn_id,
        content: row.content,
        participant_id: row.participant_id,
        participant_name: row.participant_name,
        source_type: row.source_type,
        created_at: row.created_at,
        embedding: embedding
      };
    });
    
    // Simple semantic clustering using PCA-like dimension reduction
    function dotProduct(a, b) {
      return a.reduce((sum, val, i) => sum + val * b[i], 0);
    }
    
    function magnitude(vec) {
      return Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
    }
    
    function cosineSimilarity(a, b) {
      const dot = dotProduct(a, b);
      const magA = magnitude(a);
      const magB = magnitude(b);
      return magA > 0 && magB > 0 ? dot / (magA * magB) : 0;
    }
    
    // Simple 2D projection: use first two principal components
    // For simplicity, we'll use the first two dimensions after normalization
    const finalData = turns.map((turn, idx) => {
      const embedding = turn.embedding;
      
      // Use first 2 dimensions as rough x,y coordinates
      let x = embedding[0] || 0;
      let y = embedding[1] || 0;
      
      // Normalize to reasonable screen coordinates
      x = 400 + (x * 2000); // Center at 400, spread over ~4000 pixels
      y = 300 + (y * 2000); // Center at 300, spread over ~4000 pixels
      
      // Clamp to reasonable bounds
      x = Math.max(50, Math.min(750, x));
      y = Math.max(50, Math.min(550, y));
      
      return {
        turn_id: turn.turn_id,
        content: turn.content,
        participant_id: turn.participant_id,
        participant_name: turn.participant_name,
        source_type: turn.source_type,
        created_at: turn.created_at,
        x: x,
        y: y,
        turn_order: idx + 1
      };
    });
    
    res.json({
      embeddings: finalData,
      stats: {
        total: result.rows.length,
        participants: new Set(turns.map(t => t.participant_id)).size
      }
    });
    
  } catch (error) {
    console.error('Error fetching embeddings:', error);
    res.status(500).json({ error: 'Failed to fetch embeddings' });
  }
});

// Delete a meeting and all associated data
app.delete('/api/meetings/:blockId', requireAuth, async (req, res) => {
  try {
    const { blockId } = req.params;
    
    // Start a transaction to ensure all deletions succeed or fail together
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get all turn IDs associated with this block for deletion
      const turnsResult = await client.query(`
        SELECT turn_id 
        FROM conversation.turns
        WHERE block_id = $1
      `, [blockId]);
      
      const turnIds = turnsResult.rows.map(row => row.turn_id);
      
      // Delete in the correct order to avoid foreign key constraint violations
      
      // 1. Delete turns (now they belong directly to the block)
      if (turnIds.length > 0) {
        const turnIdsList = turnIds.map((_, i) => `$${i + 1}`).join(',');
        await client.query(`DELETE FROM conversation.turns WHERE turn_id IN (${turnIdsList})`, turnIds);
      }
      
      // 2. Delete block_meetings
      await client.query('DELETE FROM conversation.block_meetings WHERE block_id = $1', [blockId]);
      
      // 3. Delete the block itself
      const blockResult = await client.query('DELETE FROM conversation.blocks WHERE block_id = $1 RETURNING name', [blockId]);
      
      await client.query('COMMIT');
      
      if (blockResult.rows.length === 0) {
        return res.status(404).json({ error: 'Meeting not found' });
      }
      
      res.json({ 
        success: true, 
        message: `Meeting "${blockResult.rows[0].name}" deleted successfully`,
        deletedTurns: turnIds.length
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error deleting meeting:', error);
    res.status(500).json({ error: 'Failed to delete meeting' });
  }
});

app.get('/api/block-summary/:blockId', requireAuth, async (req, res) => {
  try {
    const { blockId } = req.params;
    const summary = await similarityOrchestrator.getSummaryStats(blockId);
    res.json(summary);
  } catch (error) {
    console.error('Block summary error:', error);
    res.status(500).json({ error: 'Failed to get block summary' });
  }
});

app.post('/api/compare-blocks', requireAuth, async (req, res) => {
  try {
    const { blockId1, blockId2, options = {} } = req.body;
    
    if (!blockId1 || !blockId2) {
      return res.status(400).json({ error: 'Two block IDs are required' });
    }
    
    const comparison = await similarityOrchestrator.compareBlocks(blockId1, blockId2, options);
    res.json(comparison);
    
  } catch (error) {
    console.error('Block comparison error:', error);
    res.status(500).json({ error: 'Failed to compare blocks' });
  }
});

// Bot creation endpoint - moved from recall-bot server
// Browser conversation capture endpoint
app.post('/api/capture-browser-conversation', async (req, res) => {
  try {
    const { 
      platform, 
      sessionId, 
      userPrompt, 
      aiResponse, 
      claudeResponse, // For backwards compatibility
      timestamp,
      url,
      metadata 
    } = req.body;

    // Normalize response field names
    const responseContent = aiResponse || claudeResponse;

    if (!sessionId || !userPrompt || !responseContent) {
      return res.status(400).json({ 
        error: 'Missing required fields: sessionId, userPrompt, and aiResponse/claudeResponse' 
      });
    }


    // Check if we already have a block for this session
    let blockResult = await pool.query(
      'SELECT block_id FROM conversation.blocks WHERE name = $1 AND block_type = $2',
      [`${platform} Session ${sessionId}`, 'browser_conversation']
    );

    let blockId;
    if (blockResult.rows.length === 0) {
      // Create new block for this browser session
      const newBlockId = uuidv4();
      await pool.query(`
        INSERT INTO conversation.blocks (block_id, name, description, block_type, metadata, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      `, [
        newBlockId,
        `${platform} Session ${sessionId}`,
        `Browser conversation session on ${platform} started at ${new Date().toISOString()}`,
        'browser_conversation',
        JSON.stringify({ 
          sessionId, 
          platform, 
          url, 
          ...metadata 
        })
      ]);
      blockId = newBlockId;
      console.log(`✅ Created new browser session block: ${blockId}`);
    } else {
      blockId = blockResult.rows[0].block_id;
    }

    // Create turns for user prompt and AI response
    const userTurnId = uuidv4();
    const aiTurnId = uuidv4();
    
    // Insert user turn
    await pool.query(`
      INSERT INTO conversation.turns (turn_id, content, source_type, metadata, timestamp, block_id, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, [
      userTurnId, 
      userPrompt, 
      'user_input', 
      JSON.stringify({ sessionId, platform, url }),
      timestamp || new Date().toISOString(),
      blockId
    ]);

    // Insert AI turn with slightly later timestamp to ensure ordering
    const aiTimestamp = timestamp ? new Date(timestamp).getTime() + 1 : Date.now() + 1;
    await pool.query(`
      INSERT INTO conversation.turns (turn_id, content, source_type, metadata, timestamp, block_id, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, [
      aiTurnId, 
      responseContent, 
      `${platform}_response`, 
      JSON.stringify({ sessionId, platform, url, ...metadata }),
      new Date(aiTimestamp).toISOString(),
      blockId
    ]);

    console.log(`✅ Captured browser conversation: ${platform} session ${sessionId}`);
    
    res.json({ 
      success: true, 
      blockId,
      message: 'Conversation captured successfully' 
    });

  } catch (error) {
    console.error('❌ Error capturing browser conversation:', error);
    res.status(500).json({ 
      error: 'Failed to capture conversation',
      details: error.message 
    });
  }
});

app.post('/api/create-bot', requireAuth, upload.array('files', 10), async (req, res) => {
  try {
    const { meeting_url, meeting_name } = req.body;
    const user_id = req.session.user.user_id || req.session.user.id;
    let client_id = req.session.user.client_id;
    
    if (!meeting_url) {
      return res.status(400).json({ error: 'Meeting URL is required' });
    }
    
    // If client_id is missing from session, use default client (temporary fix)
    if (!client_id) {
      console.log(`Client ID missing from session for user ${user_id}, using default client_id = 1`);
      client_id = 1; // Default to client 1 for now
      
      // TODO: Add client_id column to client_mgmt.users table and proper lookup
    }
    
    console.log(`Creating bot for user ${user_id}, client ${client_id}, meeting: ${meeting_url}`);
    
    // Get the external URL for WebSocket connection
    let websocketUrl;
    let webhookUrl;
    if (process.env.RENDER_EXTERNAL_URL) {
      // Remove protocol if present
      const cleanUrl = process.env.RENDER_EXTERNAL_URL.replace(/^https?:\/\//, '');
      websocketUrl = `wss://${cleanUrl}/transcript`;
      webhookUrl = `https://${cleanUrl}/webhook/chat`;
    } else {
      websocketUrl = `ws://localhost:${process.env.PORT || 3000}/transcript`;
      webhookUrl = `http://localhost:${process.env.PORT || 3000}/webhook/chat`;
    }
    
    console.log('WebSocket URL for real-time transcription:', websocketUrl);
    console.log('Webhook URL for chat messages:', webhookUrl);
    
    // Check if API key is available
    if (!process.env.RECALL_API_KEY) {
      console.error('RECALL_API_KEY not found in environment variables');
      return res.status(500).json({ error: 'Recall.ai API key not configured' });
    }

    console.log('Using Recall.ai API key:', process.env.RECALL_API_KEY.substring(0, 8) + '...');

    // Create bot with Recall.ai
    const recallResponse = await fetch('https://us-west-2.recall.ai/api/v1/bot/', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.RECALL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        meeting_url: meeting_url,
        bot_name: 'Cogito',
        recording_config: {
          transcript: {
            provider: {
              meeting_captions: {}
            }
          },
          realtime_endpoints: [
            {
              type: "websocket",
              url: websocketUrl,
              events: [
                "transcript.data", 
                "transcript.partial_data"
              ]
            },
            {
              type: "webhook",
              url: webhookUrl,
              events: ["participant_events.chat_message"]
            }
          ]
        },
        chat: {
          on_bot_join: {
            send_to: "everyone",
            message: "🤖 Cogito has joined the meeting! Type ? for my thoughts on the conversation, or @cc for specific questions."
          }
        },
        webhook_url: webhookUrl
      })
    });
    
    if (!recallResponse.ok) {
      const error = await recallResponse.text();
      console.error('Recall.ai error:', error);
      return res.status(recallResponse.status).json({ 
        error: 'Failed to create bot', 
        details: error 
      });
    }
    
    const botData = await recallResponse.json();
    console.log('Bot created:', botData);
    
    console.log('Creating block and meeting record for bot:', botData.id);
    
    // Create a block for this meeting with proper user and client IDs
    const blockResult = await pool.query(
      `INSERT INTO conversation.blocks (name, description, block_type, created_by_user_id, client_id, metadata) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        meeting_name || `Meeting ${new Date().toISOString()}`,
        `Meeting from ${meeting_url}`,
        'meeting',
        user_id,     // The actual user who created it
        client_id,   // The client that user belongs to
        { created_by: 'recall_bot', recall_bot_id: botData.id }
      ]
    );
    const block = blockResult.rows[0];
    console.log('Block created:', block.block_id);
    
    // Create meeting-specific data
    const userEmail = req.session.user.email;
    
    const meetingResult = await pool.query(
      `INSERT INTO conversation.block_meetings (block_id, recall_bot_id, meeting_url, invited_by_user_id, transcript_email, status, meeting_name) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [block.block_id, botData.id, meeting_url, user_id, userEmail, 'joining', meeting_name || 'Unnamed Meeting']
    );
    const meeting = meetingResult.rows[0];
    console.log('Meeting record created:', meeting.block_id);
    
    // Process uploaded files if any
    let uploadedFiles = [];
    if (req.files && req.files.length > 0) {
      console.log(`Processing ${req.files.length} uploaded files for meeting ${meeting.id}`);
      
      for (const file of req.files) {
        try {
          // Process file using FileUploadService
          const fileUpload = await fileUploadService.processFile(file, {
            clientId: client_id,
            description: `Meeting resource for: ${meeting_name || meeting_url}`,
            tags: ['meeting', 'resource']
          });
          
          // Link file to meeting via junction table
          await pool.query(
            `INSERT INTO conversation.block_meeting_files (block_meeting_id, file_upload_id, created_by_user_id) 
             VALUES ($1, $2, $3)`,
            [meeting.id, fileUpload.id, user_id]
          );
          
          uploadedFiles.push({
            id: fileUpload.id,
            filename: fileUpload.filename,
            size: fileUpload.file_size
          });
          
          console.log(`✅ Processed file: ${fileUpload.filename} (ID: ${fileUpload.id})`);
          
          // Clean up temp file
          fs.unlink(file.path, (err) => {
            if (err) console.error('Error deleting temp file:', err);
          });
          
        } catch (fileError) {
          console.error(`❌ Error processing file ${file.originalname}:`, fileError);
          // Continue processing other files
        }
      }
    }
    
    res.json({
      bot: botData,
      meeting: meeting,
      block: block,
      uploadedFiles: uploadedFiles
    });
  } catch (error) {
    console.error('Bot creation error:', error);
    console.error('Request body:', req.body);
    console.error('User session:', req.session?.user);
    res.status(500).json({ error: 'Failed to create bot', details: error.message });
  }
});

// Get running bots endpoint - moved from recall-bot server
app.get('/api/bots', requireAuth, async (req, res) => {
  try {
    const user_id = req.session.user.user_id || req.session.user.id;
    
    const result = await pool.query(`
      SELECT 
        id,
        recall_bot_id as bot_id,
        meeting_url,
        meeting_name,
        status,
        created_at,
        updated_at
      FROM conversation.block_meetings
      WHERE status = 'active'
      ORDER BY created_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching bots:', error);
    res.status(500).json({ error: 'Failed to fetch bots' });
  }
});

// Get stuck meetings endpoint - moved from recall-bot server
app.get('/api/stuck-meetings', requireAuth, async (req, res) => {
  try {
    console.log('Fetching stuck meetings...');
    const result = await pool.query(`
      SELECT 
        id,
        recall_bot_id as meeting_id,
        meeting_url,
        meeting_name,
        status,
        created_at,
        updated_at,
        recall_bot_id as bot_id,
        0 as turn_count
      FROM conversation.block_meetings
      WHERE status = 'joining'
      ORDER BY created_at DESC
    `);
    
    console.log('Found stuck meetings:', result.rows.length);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching stuck meetings:', error);
    res.status(500).json({ error: 'Failed to fetch stuck meetings' });
  }
});

// Force complete stuck meeting endpoint - moved from recall-bot server
app.post('/api/stuck-meetings/:meetingId/complete', requireAuth, async (req, res) => {
  try {
    const { meetingId } = req.params;
    
    // Update the meeting status to completed
    const result = await pool.query(`
      UPDATE conversation.block_meetings 
      SET status = 'completed', updated_at = NOW()
      WHERE recall_bot_id = $1
      RETURNING *
    `, [meetingId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    
    // Note: Only updating block_meetings table since that's where the meeting status is tracked
    
    res.json({ 
      success: true, 
      message: 'Meeting marked as completed',
      meeting: result.rows[0]
    });
  } catch (error) {
    console.error('Error completing stuck meeting:', error);
    res.status(500).json({ error: 'Failed to complete meeting' });
  }
});

// Shutdown bot endpoint - moved from recall-bot server
app.post('/api/bots/:botId/leave', requireAuth, async (req, res) => {
  try {
    const { botId } = req.params;
    const user_id = req.session.user.user_id || req.session.user.id;
    
    console.log(`Shutting down bot ${botId} for user ${user_id}`);
    
    // Update the bot status to leaving in block_meetings table
    const updateResult = await pool.query(`
      UPDATE conversation.block_meetings 
      SET status = 'leaving', updated_at = NOW()
      WHERE recall_bot_id = $1
      RETURNING *
    `, [botId]);
    
    if (updateResult.rows.length === 0) {
      console.log(`No bot found with ID ${botId}`);
      return res.status(404).json({ error: 'Bot not found' });
    }
    
    console.log(`Bot ${botId} status updated to leaving`);
    
    // Here you would typically call the Recall API to actually leave the meeting
    // For now, we'll just simulate it by updating the status after a delay
    setTimeout(async () => {
      try {
        await pool.query(`
          UPDATE conversation.block_meetings 
          SET status = 'inactive', updated_at = NOW()
          WHERE recall_bot_id = $1
        `, [botId]);
        console.log(`Bot ${botId} status updated to inactive`);
      } catch (error) {
        console.error('Error updating bot status to inactive:', error);
      }
    }, 2000); // Simulate delay
    
    res.json({ success: true, message: 'Bot is leaving the meeting' });
  } catch (error) {
    console.error('Error leaving bot:', error);
    res.status(500).json({ error: 'Failed to leave bot' });
  }
});

// Chat webhook endpoint for Recall.ai bot
app.post('/webhook/chat', async (req, res) => {
  try {
    console.log('💬 Received chat webhook:', JSON.stringify(req.body, null, 2));
    
    const { data } = req.body;
    
    if (!data) {
      console.log('❌ No data in chat webhook');
      return res.status(400).json({ error: 'No data provided' });
    }
    
    // Extract message and bot info from nested structure
    const botId = data.bot?.id;
    const messageText = data.data?.data?.text;
    
    if (!messageText || !botId) {
      console.log('❌ Missing message or bot ID in chat webhook');
      return res.status(400).json({ error: 'Missing message or bot ID' });
    }
    
    console.log(`💬 Chat message from bot ${botId}: "${messageText}"`);
    
    // Find the meeting for this bot with client info
    const meetingResult = await pool.query(`
      SELECT bm.*, b.client_id 
      FROM conversation.block_meetings bm
      JOIN conversation.blocks b ON b.block_id = bm.block_id
      WHERE bm.recall_bot_id = $1
    `, [botId]);
    
    if (meetingResult.rows.length === 0) {
      console.log(`❌ No meeting found for bot ${botId}`);
      return res.status(404).json({ error: 'Meeting not found' });
    }
    
    const meeting = meetingResult.rows[0];
    const blockId = meeting.block_id;
    
    // Extract participant info if available  
    const participantData = data.data?.participant;
    const senderName = participantData?.name || 'Unknown';
    
    // Ignore messages from Cogito itself to prevent loops
    if (senderName === 'Cogito' || senderName.toLowerCase().includes('cogito')) {
      console.log('🔄 Ignoring message from Cogito to prevent loop');
      return res.json({ success: true, message: 'Ignoring bot message' });
    }
    
    // Append chat message to conversation timeline
    const chatEntry = `[${senderName} via chat] ${messageText}\n`;
    await appendToConversation(blockId, chatEntry);
    console.log(`📝 Appended chat message from ${senderName}`);
    
    // Check if this is a question command or directed at Cogito
    const lowerMessage = messageText.toLowerCase().trim();
    const isQuestion = messageText.trim() === '?';
    const isDirectedAtCogito = lowerMessage.startsWith('cogito') || 
                               lowerMessage.startsWith('hi cogito') || 
                               lowerMessage.startsWith('hey cogito') ||
                               lowerMessage.startsWith('hello cogito');
    
    if (isQuestion || isDirectedAtCogito) {
      console.log('❓ Question/Direct message detected - generating response');
      
      // Get conversation context from the timeline
      const conversationResult = await pool.query(
        'SELECT full_transcript FROM conversation.block_meetings WHERE block_id = $1',
        [blockId]
      );
      
      const transcriptArray = conversationResult.rows[0]?.full_transcript || [];
      
      // Generate response based on the type of query
      let response = "";
      
      if (isDirectedAtCogito) {
        // Extract the actual question after "cogito"
        const questionMatch = messageText.match(/cogito[,:]?\s*(.+)/i);
        const question = questionMatch ? questionMatch[1].trim() : messageText;
        
        // Generate intelligent response using Claude
        try {
          if (!Array.isArray(transcriptArray) || transcriptArray.length === 0) {
            response = "I haven't captured much conversation content yet. Please continue the meeting and I'll be able to provide better responses.";
          } else {
            // Convert transcript to text for Claude
            const conversationText = transcriptArray
              .map(entry => entry.content || '')
              .join('\n');
            
            // Query relevant files based on the question using semantic search
            let relevantFileContent = '';
            try {
              // Use FileUploadService for semantic search
              const clientId = meeting.client_id || 6; // Default to cogito client
              const fileSearchResults = await fileUploadService.searchFileContent(question, clientId, 3);
              
              // Filter results to only files associated with this meeting
              const meetingFileIds = await pool.query(`
                SELECT file_upload_id FROM conversation.block_meeting_files 
                WHERE block_meeting_id = $1
              `, [meeting.id]);
              
              const meetingFileIdSet = new Set(meetingFileIds.rows.map(row => row.file_upload_id));
              const relevantResults = fileSearchResults.filter(result => 
                meetingFileIdSet.has(result.file_upload_id)
              );
              
              if (relevantResults.length > 0) {
                relevantFileContent = '\n\nRELEVANT UPLOADED DOCUMENTS:\n' + 
                  relevantResults.map(result => 
                    `From ${result.filename}: ${result.content_text.substring(0, 500)}...`
                  ).join('\n\n');
              }
            } catch (fileError) {
              console.error('Error querying files:', fileError);
              // Continue without file context
            }
            
            if (anthropic && process.env.ANTHROPIC_API_KEY) {
              const prompt = `You are Cogito, an AI meeting assistant listening to a live meeting. You have access to the conversation transcript and any relevant uploaded documents.

CONVERSATION TRANSCRIPT:
${conversationText}${relevantFileContent}

PARTICIPANT'S QUESTION: "${question}"

Please provide a helpful, contextual response based on the meeting content and any relevant documents. Be concise (2-3 sentences max) and specific to what's been discussed. If the question asks about people, refer to the transcript for context about who they are and what they've said.`;

              const message = await anthropic.messages.create({
                model: "claude-3-haiku-20240307",
                max_tokens: 300,
                messages: [{ role: "user", content: prompt }]
              });
              
              response = message.content[0].text;
            } else {
              response = `I heard your question: "${question}". I have conversation data but Claude AI is not available to analyze it. Please check the ANTHROPIC_API_KEY configuration.`;
            }
          }
        } catch (error) {
          console.error('❌ Error generating intelligent chat response:', error);
          response = `I heard your question: "${question}". I'm having trouble analyzing the conversation right now, but I'm still listening.`;
        }
      } else {
        // '?' command - provide meeting summary
        try {
          if (!Array.isArray(transcriptArray) || transcriptArray.length === 0) {
            response = "I haven't captured any content yet - are you speaking into the microphone?";
          } else {
            // Convert transcript to text for Claude
            const conversationText = transcriptArray
              .map(entry => entry.content || '')
              .join('\n');
            
            // Get list of uploaded files for context
            let uploadedFilesContext = '';
            try {
              const uploadedFiles = await pool.query(`
                SELECT f.filename, f.description
                FROM files.file_uploads f
                JOIN conversation.block_meeting_files bmf ON bmf.file_upload_id = f.id
                WHERE bmf.block_meeting_id = $1
              `, [meeting.id]);
              
              if (uploadedFiles.rows.length > 0) {
                uploadedFilesContext = '\n\nUPLOADED MEETING RESOURCES:\n' + 
                  uploadedFiles.rows.map(file => `- ${file.filename}`).join('\n');
              }
            } catch (fileError) {
              console.error('Error getting uploaded files:', fileError);
            }
            
            if (anthropic && process.env.ANTHROPIC_API_KEY) {
              const prompt = `You are Cogito, an AI meeting assistant. Provide a brief status update about this live meeting.

CONVERSATION TRANSCRIPT:
${conversationText}${uploadedFilesContext}

Please provide a concise 2-3 sentence summary that includes:
- How many speakers are active
- What the current discussion topic seems to be about
- Any key points or themes emerging

Keep it brief and focused on what's happening right now in the meeting.`;

              const message = await anthropic.messages.create({
                model: "claude-3-haiku-20240307",
                max_tokens: 200,
                messages: [{ role: "user", content: prompt }]
              });
              
              response = message.content[0].text;
            } else {
              // Fallback to basic speaker counting if Claude unavailable
              const speakerMatches = conversationText.match(/\[([^\]]+?)\]/g) || [];
              const speakers = [...new Set(speakerMatches.map(match => 
                match.replace(/[\[\]]/g, '').replace(' via chat', '')
              ))].filter(s => s && s !== 'Cogito');
              
              response = `I'm listening to your conversation. I can see ${speakers.length} speakers: ${speakers.join(', ')}. Claude AI is not available for detailed analysis.`;
            }
          }
        } catch (error) {
          console.error('❌ Error generating meeting summary:', error);
          response = "I'm listening to your conversation but having trouble analyzing it right now. Please continue and try again.";
        }
      }
      
      console.log(`🤖 Generated response: "${response}"`);
      
      // Send response back to meeting chat via Recall.ai API
      try {
        console.log('📤 Sending response to meeting chat:', response);
        
        const chatResponse = await fetch(`https://us-west-2.recall.ai/api/v1/bot/${botId}/send_chat_message/`, {
          method: 'POST',
          headers: {
            'Authorization': `Token ${process.env.RECALL_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: response
          })
        });
        
        if (chatResponse.ok) {
          console.log('✅ Chat response sent successfully');
          
          // Append Cogito's response to the conversation timeline
          const cogitoEntry = `[Cogito via chat] ${response}\n`;
          await appendToConversation(blockId, cogitoEntry);
          console.log('📝 Appended Cogito response to timeline');
        } else {
          const errorText = await chatResponse.text();
          console.error('❌ Failed to send chat response:', chatResponse.status, errorText);
        }
      } catch (chatError) {
        console.error('❌ Error sending chat response:', chatError);
      }
      
      return res.json({ 
        success: true, 
        message: 'Question processed',
        response: response
      });
    }
    
    // For other chat messages, just log them
    console.log(`💬 Chat message (not a command): "${messageText}"`);
    res.json({ success: true, message: 'Chat message received' });
    
  } catch (error) {
    console.error('❌ Error processing chat webhook:', error);
    res.status(500).json({ error: 'Failed to process chat webhook' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'conversational-repl' });
});

// Removed transcript buffers - using direct append approach

// Track full meeting transcripts in memory (for real-time interaction)
const meetingTranscripts = new Map();

// Track last activity per meeting for inactivity detection
const meetingLastActivity = new Map();

// Transcript processing helper functions
async function processTranscriptChunk(meeting, speakerName, text) {
  const blockMeetingId = meeting.block_meeting_id;
  
  // Get or create speaker profile agent for this meeting
  let speakerAgent = meetingSpeakerAgents.get(blockMeetingId);
  if (!speakerAgent) {
    speakerAgent = new SpeakerProfileAgent({
      meetingUrl: meeting.meeting_url,
      profileTurnLimit: 50
    });
    meetingSpeakerAgents.set(blockMeetingId, speakerAgent);
    console.log(`👥 Created speaker profile agent for meeting ${blockMeetingId} with context: ${speakerAgent.context}`);
  }
  
  // Get or create transcript buffer for this meeting
  let buffer = meetingBuffers.get(blockMeetingId);
  if (!buffer) {
    buffer = new TranscriptBufferAgent({
      maxLength: 1000,
      onTurnReady: async (turn) => {
        // Process speaker profile first to get user_id
        const userId = await speakerAgent.processSpeaker(turn.speaker, turn.blockId);
        
        // Add user_id to turn if speaker was identified
        if (userId) {
          turn.user_id = userId;
          console.log(`[Transcript] Identified speaker ${turn.speaker} as user_id: ${userId}`);
        }
        
        // Send to embedding agent for async processing
        await embeddingAgent.processTurn(turn);
      }
    });
    
    // Initialize buffer for this meeting
    buffer.startNewBlock({
      blockId: meeting.block_id,
      blockMeetingId: blockMeetingId,
      clientId: meeting.client_id || 6 // Default to cogito client
    });
    
    meetingBuffers.set(blockMeetingId, buffer);
    console.log(`🔧 Created transcript buffer for meeting ${blockMeetingId}`);
  }
  
  // Add chunk to buffer (will trigger flush when appropriate)
  await buffer.addChunk({
    speaker: speakerName,
    text: text,
    timestamp: new Date()
  });
}

async function endMeetingTranscriptProcessing(blockMeetingId) {
  const buffer = meetingBuffers.get(blockMeetingId);
  const speakerAgent = meetingSpeakerAgents.get(blockMeetingId);
  
  let summary = null;
  if (buffer) {
    summary = await buffer.endBlock();
    meetingBuffers.delete(blockMeetingId);
    console.log(`🏁 Ended transcript processing for meeting ${blockMeetingId}: ${summary.totalTurns} turns processed`);
  }
  
  if (speakerAgent) {
    const stats = speakerAgent.getStats();
    meetingSpeakerAgents.delete(blockMeetingId);
    console.log(`👥 Cleaned up speaker agent for meeting ${blockMeetingId}: ${stats.cachedSpeakers} speakers, ${stats.processedSpeakers} profiles generated`);
  }
  
  return summary;
}

// Simple conversation timeline helper
async function appendToConversation(blockId, content) {
  try {
    // Get current transcript
    const currentResult = await pool.query(
      'SELECT full_transcript FROM conversation.block_meetings WHERE block_id = $1',
      [blockId]
    );
    
    if (currentResult.rows.length === 0) {
      console.error(`❌ Block meeting not found: ${blockId}`);
      return false;
    }
    
    // Build transcript array
    let transcript = currentResult.rows[0].full_transcript || [];
    if (!Array.isArray(transcript)) {
      // If it's not an array, convert it to one
      transcript = [];
    }
    
    // Add new entry with timestamp
    transcript.push({
      timestamp: new Date().toISOString(),
      content: content
    });
    
    // Update with the new transcript array
    const result = await pool.query(
      'UPDATE conversation.block_meetings SET full_transcript = $1 WHERE block_id = $2 RETURNING *',
      [JSON.stringify(transcript), blockId]
    );
    
    return true;
  } catch (error) {
    console.error('❌ Error appending to conversation:', error);
    return false;
  }
}

// Advanced transcript cleaning function (moved from clean-meeting-47-transcript-v2.js)
function cleanTranscript(messages) {
    let cleanedSections = [];
    let currentSpeaker = null;
    let currentText = '';
    
    messages.forEach((message, index) => {
        let speaker = message.speaker || 'Unknown';
        let text = message.content || message.text || '';
        
        // Skip empty messages
        if (!text.trim()) return;
        
        // Clean up speaker names
        speaker = speaker.trim();
        
        // Check if the text contains bracketed speaker names like [Ian Palonis]
        const bracketMatch = text.match(/^\[([^\]]+)\]\s*/);
        if (bracketMatch) {
            // Extract the speaker from brackets
            speaker = bracketMatch[1].trim();
            // Remove the bracketed name from the text
            text = text.substring(bracketMatch[0].length).trim();
        }
        
        // Look for speaker identification patterns in the remaining text
        const speakerPatterns = [
            /^(?:This is|this is)\s+([A-Z][a-z]+)\b/,
            /^(?:It's|it's)\s+([A-Z][a-z]+)\b/
        ];
        
        let textWithoutSpeaker = text;
        let identifiedSpeaker = null;
        
        // Try to find speaker announcement in the text
        for (let pattern of speakerPatterns) {
            const match = text.match(pattern);
            if (match) {
                let name = match[1];
                
                // Fix common transcription errors
                if (name.toLowerCase() === 'skin') name = 'Ken';
                
                identifiedSpeaker = name;
                
                // Remove the speaker identification from the beginning
                textWithoutSpeaker = text.replace(pattern, '').trim();
                break;
            }
        }
        
        // Use identified speaker if found, otherwise use the speaker from brackets or message
        const finalSpeaker = identifiedSpeaker || speaker;
        
        // Clean up the text
        textWithoutSpeaker = textWithoutSpeaker.trim();
        
        // Capitalize first letter if needed
        if (textWithoutSpeaker.length > 0 && /^[a-z]/.test(textWithoutSpeaker)) {
            textWithoutSpeaker = textWithoutSpeaker.charAt(0).toUpperCase() + textWithoutSpeaker.slice(1);
        }
        
        // Check if speaker changed
        if (currentSpeaker !== finalSpeaker) {
            // Save the previous speaker's text if any
            if (currentSpeaker && currentText) {
                cleanedSections.push(`${currentSpeaker}: ${currentText}`);
            }
            // Start new speaker
            currentSpeaker = finalSpeaker;
            currentText = textWithoutSpeaker;
        } else {
            // Same speaker, append text
            if (currentText && textWithoutSpeaker) {
                currentText += ' ' + textWithoutSpeaker;
            } else if (textWithoutSpeaker) {
                currentText = textWithoutSpeaker;
            }
        }
        
        // Handle last message
        if (index === messages.length - 1 && currentText) {
            cleanedSections.push(`${currentSpeaker}: ${currentText}`);
        }
    });
    
    // Join with double newlines for paragraph breaks
    return cleanedSections.join('\n\n');
}

// Format transcript for email with smart speaker grouping (legacy function)
function formatTranscriptForEmail(transcriptArray) {
  if (!Array.isArray(transcriptArray) || transcriptArray.length === 0) {
    return 'No transcript content available.';
  }
  
  // Use the advanced cleaning function
  return cleanTranscript(transcriptArray);
}

// Send transcript email function
async function sendTranscriptEmail(blockId, meeting) {
  try {
    console.log(`📧 Preparing to send transcript email for block_id: ${blockId}`);
    
    if (!meeting.transcript_email) {
      console.error('❌ No email address configured for this meeting');
      return;
    }
    
    if (meeting.email_sent) {
      console.log(`⚠️  Email already sent to ${meeting.transcript_email}`);
      return;
    }
    
    // Get the transcript text with smart speaker formatting
    let transcriptText = 'No transcript content available.';
    if (Array.isArray(meeting.full_transcript) && meeting.full_transcript.length > 0) {
      transcriptText = formatTranscriptForEmail(meeting.full_transcript);
    }
    
    // Format transcript for email
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f0f0f0; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .transcript { background-color: #f9f9f9; padding: 20px; border-left: 4px solid #4CAF50; white-space: pre-wrap; font-family: 'Courier New', monospace; }
        .footer { margin-top: 20px; padding: 20px; background-color: #f0f0f0; border-radius: 8px; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Meeting Transcript</h2>
            <p><strong>Meeting:</strong> ${meeting.meeting_name || 'Untitled Meeting'}</p>
            <p><strong>Date:</strong> ${new Date(meeting.started_at || meeting.created_at).toLocaleString()}</p>
            <p><strong>Meeting URL:</strong> <a href="${meeting.meeting_url}">${meeting.meeting_url}</a></p>
        </div>
        
        <div class="transcript">
${transcriptText}
        </div>
        
        <div class="footer">
            <p>This transcript was automatically generated by Cogito Meeting Bot.</p>
            <p>Thank you for using our service!</p>
        </div>
    </div>
</body>
</html>
`;

    const mailOptions = {
      from: process.env.RESEND_FROM_EMAIL ? 
        `"Cogito Meeting Bot" <${process.env.RESEND_FROM_EMAIL}>` :
        process.env.GMAIL_USER ? 
        `"Cogito Meeting Bot" <${process.env.GMAIL_USER}>` : 
        '"Cogito Meeting Bot" <meetings@cogito-meetings.onrender.com>',
      to: meeting.transcript_email,
      subject: `Meeting Transcript: ${meeting.meeting_name || 'Your Meeting'}`,
      html: htmlContent,
      text: `Meeting Transcript\n\n${transcriptText}`
    };
    
    console.log('📮 Sending email...');
    
    const transporter = await getEmailTransporter();
    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Transcript email sent successfully to ${meeting.transcript_email}`);
    
    // Mark as sent in database
    await pool.query(`
      UPDATE conversation.block_meetings 
      SET email_sent = TRUE 
      WHERE block_id = $1
    `, [blockId]);
    
    console.log('✅ Database updated: email_sent = TRUE');
    
  } catch (error) {
    console.error('❌ Error sending transcript email:', error);
    
    // Log the error details
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Email delivery failed - connection refused');
      console.error('   This is normal in development/testing environments');
      console.error('   Email content has been logged above for verification');
    }
    throw error;
  }
}

// Removed old buffering and participant creation logic - using simple append-only approach

// Complete meeting due to inactivity or abandonment
async function completeMeetingByInactivity(botId, reason = 'inactivity') {
  try {
    console.log(`⏰ Completing meeting ${botId} due to ${reason}`);
    
    // Get meeting info
    const meetingResult = await pool.query(
      'SELECT * FROM conversation.block_meetings WHERE recall_bot_id = $1 AND status NOT IN ($2, $3)',
      [botId, 'completed', 'failed']
    );
    
    if (meetingResult.rows.length === 0) {
      console.log(`No active meeting found for bot ${botId}`);
      return;
    }
    
    const meeting = meetingResult.rows[0];
    
    // End transcript processing for this meeting
    await endMeetingTranscriptProcessing(meeting.block_meeting_id);
    
    // Update meeting status 
    await pool.query(
      `UPDATE conversation.block_meetings 
       SET status = $1, ended_at = NOW()
       WHERE recall_bot_id = $2`,
      ['completed', botId]
    );
    
    // Append completion info to transcript
    await appendToConversation(meeting.block_id, `[System] Meeting ended: ${reason}`);
    
    console.log(`✅ Meeting ${botId} completed due to ${reason}`);
    
    // Clean up tracking data
    meetingLastActivity.delete(botId);
    
    // Send email transcript
    if (meeting.transcript_email && meeting.full_transcript) {
      try {
        await sendTranscriptEmail(meeting.block_id, meeting);
        console.log(`✅ Transcript email sent to: ${meeting.transcript_email}`);
      } catch (error) {
        console.error(`❌ Failed to send transcript email:`, error);
      }
    } else {
      console.log(`📧 No email sent - missing email (${!!meeting.transcript_email}) or transcript (${!!meeting.full_transcript})`);
    }
    
    return meeting;
    
  } catch (error) {
    console.error(`❌ Error completing meeting ${botId}:`, error);
  }
}

// Periodic cleanup of inactive meetings
async function cleanupInactiveMeetings() {
  try {
    const now = Date.now();
    const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes
    const MAXIMUM_MEETING_DURATION = 4 * 60 * 60 * 1000; // 4 hours max
    
    console.log('🧹 Running meeting cleanup...');
    
    // Check for inactive meetings based on last activity
    for (const [botId, lastActivity] of meetingLastActivity.entries()) {
      const timeSinceActivity = now - lastActivity;
      
      if (timeSinceActivity > INACTIVITY_TIMEOUT) {
        console.log(`⏰ Meeting ${botId} inactive for ${Math.floor(timeSinceActivity/1000/60)} minutes`);
        await completeMeetingByInactivity(botId, 'inactivity_timeout');
      }
    }
    
    // Check database for meetings that are stuck in joining/active status for too long
    const stuckMeetingsResult = await pool.query(`
      SELECT recall_bot_id, meeting_name, created_at, status
      FROM conversation.block_meetings
      WHERE status IN ('joining', 'active') 
        AND created_at < NOW() - INTERVAL '4 hours'
    `);
    
    for (const meeting of stuckMeetingsResult.rows) {
      console.log(`🕘 Found stuck meeting: ${meeting.recall_bot_id} (${meeting.status}) from ${meeting.created_at}`);
      await completeMeetingByInactivity(meeting.recall_bot_id, 'maximum_duration_exceeded');
    }
    
    // Clean up memory for completed meetings
    const activeMeetings = await pool.query(`
      SELECT recall_bot_id FROM conversation.block_meetings
      WHERE status IN ('joining', 'active')
    `);
    
    const activeBotIds = new Set(activeMeetings.rows.map(m => m.recall_bot_id));
    
    // Remove tracking data for completed meetings
    for (const botId of meetingLastActivity.keys()) {
      if (!activeBotIds.has(botId)) {
        meetingLastActivity.delete(botId);
      }
    }
    
    // Clean up transcript buffers for completed meetings
    const activeMeetingIds = new Set();
    for (const meeting of activeMeetings.rows) {
      // Get block_meeting_id for active meetings
      const meetingDetails = await pool.query(
        'SELECT block_meeting_id FROM conversation.block_meetings WHERE recall_bot_id = $1',
        [meeting.recall_bot_id]
      );
      if (meetingDetails.rows.length > 0) {
        activeMeetingIds.add(meetingDetails.rows[0].block_meeting_id);
      }
    }
    
    // Remove buffers for completed meetings
    for (const blockMeetingId of meetingBuffers.keys()) {
      if (!activeMeetingIds.has(blockMeetingId)) {
        await endMeetingTranscriptProcessing(blockMeetingId);
      }
    }
    
    console.log(`✅ Cleanup complete. Tracking ${meetingLastActivity.size} active meetings`);
    
  } catch (error) {
    console.error('❌ Error during meeting cleanup:', error);
  }
}

// Initialize and start server
async function startServer() {
  try {
    // Initialize turn processor
    turnProcessor = await createTurnProcessor(pool, {
      generateEmbeddings: true // Enable embedding generation
    });
    console.log('✅ Turn processor initialized with embedding support');
    
    // Initialize similarity orchestrator
    similarityOrchestrator = await createSimilarityOrchestrator(pool, {
      analyzer: {
        similarityThreshold: 0.7,
        dimensions: 1536
      }
    });
    console.log('✅ Similarity orchestrator initialized');
    
    // Import and initialize transcript processing agents (ES modules)
    const { TranscriptBufferAgent: TBA } = await import('./lib/transcript-buffer-agent.js');
    const { TurnEmbeddingAgent: TEA } = await import('./lib/turn-embedding-agent.js');
    const { SpeakerProfileAgent: SPA } = await import('./lib/speaker-profile-agent.js');
    
    TranscriptBufferAgent = TBA;
    TurnEmbeddingAgent = TEA;
    SpeakerProfileAgent = SPA;
    embeddingAgent = new TurnEmbeddingAgent();
    console.log('✅ Transcript processing agents initialized');
    
    // Create HTTP server
    const server = http.createServer(app);
    
    // Create WebSocket server
    const wss = new WebSocketServer({ server, path: '/transcript' });
    
    // WebSocket handler for real-time transcription
    wss.on('connection', (ws, req) => {
      console.log('🔗 Recall.ai bot connected for real-time transcription');
      let currentBotId = null;
      
      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          console.log('📝 Received message:', { event: message.event, type: message.data?.type || 'transcript' });
          
          // Note: Bot status changes are handled through inactivity detection
          // since status_changes.update is not a valid Recall.ai event
          
          // Handle transcript data
          if (message.event !== 'transcript.data') {
            console.log('ℹ️  Non-transcript event, skipping');
            return;
          }
          
          // Extract bot_id from the nested structure
          const botId = message.data?.bot?.id;
          if (!botId) {
            console.error('❌ No bot ID found in transcript message');
            return;
          }
          
          // Set current bot ID
          if (!currentBotId) {
            currentBotId = botId;
            console.log(`🆔 Bot ID set: ${botId}`);
          }
          
          // Update last activity timestamp for inactivity detection
          meetingLastActivity.set(botId, Date.now());
          
          // Get meeting info
          const meetingResult = await pool.query(
            'SELECT * FROM conversation.block_meetings WHERE recall_bot_id = $1',
            [botId]
          );
          
          if (meetingResult.rows.length === 0) {
            console.error('❌ No meeting found for bot:', botId);
            return;
          }
          
          const meeting = meetingResult.rows[0];
          
          // Extract transcript data from the nested structure
          const transcriptData = message.data?.data;
          console.log('🔍 Transcript data structure:', JSON.stringify(transcriptData, null, 2));
          
          if (!transcriptData?.words || !transcriptData?.participant) {
            console.error('❌ Invalid transcript data structure - missing words or participant');
            console.error('Words present:', !!transcriptData?.words);
            console.error('Participant present:', !!transcriptData?.participant);
            console.error('Available keys:', Object.keys(transcriptData || {}));
            return;
          }
          
          const participantData = transcriptData.participant;
          const speakerName = participantData.name || 'Unknown Speaker';
          const words = transcriptData.words;
          
          // Combine words into text
          const text = words.map(w => w.text).join(' ').trim();
          
          if (text.length > 0) {
            // Append directly to conversation timeline (legacy approach)
            const conversationEntry = `[${speakerName}] ${text}\n`;
            const success = await appendToConversation(meeting.block_id, conversationEntry);
            
            if (success) {
              console.log(`📝 Appended transcript from ${speakerName}: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);
            } else {
              console.error(`❌ Failed to append transcript from ${speakerName}`);
            }
            
            // NEW: Process through transcript buffer agent
            try {
              await processTranscriptChunk(meeting, speakerName, text);
            } catch (error) {
              console.error('❌ Error processing transcript chunk through agents:', error);
            }
          }
          
        } catch (error) {
          console.error('❌ Error processing transcript:', error);
        }
      });
      
      ws.on('close', async () => {
        console.log('🔌 Recall.ai bot disconnected');
        
        // If we have a current bot ID, try to complete the meeting
        if (currentBotId) {
          console.log(`🏁 WebSocket closed for bot ${currentBotId}, completing meeting`);
          
          // Give a short delay in case it's just a temporary disconnect
          setTimeout(async () => {
            try {
              await completeMeetingByInactivity(currentBotId, 'websocket_disconnect');
            } catch (error) {
              console.error(`❌ Error completing meeting on disconnect:`, error);
            }
          }, 30000); // 30 second delay
        }
      });
      
      ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
      });
    });
    
    // Start server
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Conversational REPL server running on port ${PORT}`);
      console.log(`Access the REPL at: http://localhost:${PORT}`);
      console.log(`Access from Windows at: http://172.24.145.192:${PORT}`);
      console.log(`✅ WebSocket server listening on ws://localhost:${PORT}/transcript`);
      console.log(`✅ Embeddings will be generated for new turns`);
      
      // Start periodic cleanup of inactive meetings (every 5 minutes)
      setInterval(cleanupInactiveMeetings, 5 * 60 * 1000);
      console.log(`🧹 Meeting cleanup scheduled every 5 minutes`);
      
      // Run initial cleanup after 1 minute
      setTimeout(cleanupInactiveMeetings, 60 * 1000);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
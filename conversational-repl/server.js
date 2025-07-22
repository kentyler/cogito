require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const Anthropic = require('@anthropic-ai/sdk');
const bcrypt = require('bcrypt');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const path = require('path');
const { WebSocketServer } = require('ws');
const http = require('http');
// Use global fetch available in Node.js 18+
const { createTurnProcessor } = require('./turn-processor-wrapper.cjs');
const { createSimilarityOrchestrator } = require('./similarity-orchestrator-wrapper.cjs');

// Initialize similarity orchestrator (will be set after async initialization)
let similarityOrchestrator;

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
    
    const userResult = await pool.query(
      'SELECT id, email, password_hash FROM client_mgmt.users WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = userResult.rows[0];
    
    if (!user.password_hash) {
      return res.status(401).json({ error: 'User account not activated' });
    }
    
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    req.session.user = {
      user_id: user.id,
      email: user.email
    };
    
    req.session.save((err) => {
      if (err) {
        return res.status(500).json({ error: 'Session creation failed' });
      }
      res.json({ 
        success: true, 
        user: { email: user.email }
      });
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
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
app.get('/api/auth-status', (req, res) => {
  console.log('Auth status check - Session:', req.session ? 'exists' : 'missing');
  console.log('Auth status check - Session user:', req.session?.user);
  
  if (req.session && req.session.user) {
    res.json({ 
      authenticated: true, 
      user: { email: req.session.user.email }
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
        COUNT(bt.turn_id)::integer as turn_count,
        COUNT(CASE WHEN t.content_embedding IS NOT NULL THEN 1 END)::integer as embedded_count,
        COUNT(DISTINCT t.participant_id)::integer as participant_count,
        array_agg(DISTINCT p.name) FILTER (WHERE p.name IS NOT NULL) as participant_names,
        MIN(t.created_at) as first_turn_time,
        MAX(t.created_at) as last_turn_time
      FROM conversation.blocks b
      LEFT JOIN conversation.block_meetings bm ON b.block_id = bm.block_id
      LEFT JOIN conversation.block_turns bt ON b.block_id = bt.block_id
      LEFT JOIN conversation.turns t ON bt.turn_id = t.turn_id
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
      FROM conversation.block_turns bt
      JOIN conversation.turns t ON bt.turn_id = t.turn_id
      LEFT JOIN conversation.participants p ON t.participant_id = p.id
      WHERE bt.block_id = $1
        AND t.content_embedding IS NOT NULL
      ORDER BY t.created_at
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
        SELECT t.turn_id 
        FROM conversation.block_turns bt
        JOIN conversation.turns t ON bt.turn_id = t.turn_id
        WHERE bt.block_id = $1
      `, [blockId]);
      
      const turnIds = turnsResult.rows.map(row => row.turn_id);
      
      // Delete in the correct order to avoid foreign key constraint violations
      
      // 1. Delete block_turns (junction table)
      await client.query('DELETE FROM conversation.block_turns WHERE block_id = $1', [blockId]);
      
      // 2. Delete turns (if they exist and are not referenced elsewhere)
      if (turnIds.length > 0) {
        const turnIdsList = turnIds.map((_, i) => `$${i + 1}`).join(',');
        await client.query(`DELETE FROM conversation.turns WHERE turn_id IN (${turnIdsList})`, turnIds);
      }
      
      // 3. Delete block_meetings
      await client.query('DELETE FROM conversation.block_meetings WHERE block_id = $1', [blockId]);
      
      // 4. Delete the block itself
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
app.post('/api/create-bot', requireAuth, async (req, res) => {
  try {
    const { meeting_url, meeting_name } = req.body;
    const client_id = req.session.user.user_id || req.session.user.id;
    
    if (!meeting_url) {
      return res.status(400).json({ error: 'Meeting URL is required' });
    }
    
    console.log('Creating bot for meeting:', meeting_url);
    
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
                "transcript.partial_data",
                "status_changes.update"
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
        webhook_url: `https://${process.env.RENDER_EXTERNAL_URL ? process.env.RENDER_EXTERNAL_URL.replace(/^https?:\/\//, '') : 'localhost:3000'}/webhook`
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
    
    // Create a block for this meeting with user who created it
    const blockResult = await pool.query(
      `INSERT INTO blocks (name, description, block_type, created_by_user_id, metadata) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        meeting_name || `Meeting ${new Date().toISOString()}`,
        `Meeting from ${meeting_url}`,
        'meeting',
        client_id,
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
      [block.block_id, botData.id, meeting_url, client_id, userEmail, 'joining', meeting_name || 'Unnamed Meeting']
    );
    const meeting = meetingResult.rows[0];
    console.log('Meeting record created:', meeting.block_id);
    
    res.json({
      bot: botData,
      meeting: meeting,
      block: block
    });
  } catch (error) {
    console.error('Bot creation error:', error);
    res.status(500).json({ error: 'Failed to create bot' });
  }
});

// Get running bots endpoint - moved from recall-bot server
app.get('/api/bots', requireAuth, async (req, res) => {
  try {
    const client_id = req.session.user.user_id || req.session.user.id;
    
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
    const client_id = req.session.user.user_id || req.session.user.id;
    
    console.log(`Shutting down bot ${botId} for user ${client_id}`);
    
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
    
    // Extract message and bot info
    const { message, bot } = data;
    const botId = bot?.id;
    
    if (!message || !botId) {
      console.log('❌ Missing message or bot ID in chat webhook');
      return res.status(400).json({ error: 'Missing message or bot ID' });
    }
    
    console.log(`💬 Chat message from bot ${botId}: "${message.content}"`);
    
    // Check if this is a question command
    if (message.content.trim() === '?') {
      console.log('❓ Question command detected - generating response');
      
      // Find the meeting for this bot
      const meetingResult = await pool.query(
        'SELECT * FROM conversation.block_meetings WHERE recall_bot_id = $1',
        [botId]
      );
      
      if (meetingResult.rows.length === 0) {
        console.log(`❌ No meeting found for bot ${botId}`);
        return res.status(404).json({ error: 'Meeting not found' });
      }
      
      const meeting = meetingResult.rows[0];
      const blockId = meeting.block_id;
      
      // Get recent conversation context (last 5 turns)
      const contextResult = await pool.query(`
        SELECT t.content, p.name as speaker_name, t.timestamp
        FROM conversation.turns t
        JOIN conversation.block_turns bt ON t.turn_id = bt.turn_id
        LEFT JOIN conversation.participants p ON t.participant_id = p.id
        WHERE bt.block_id = $1
        ORDER BY t.timestamp DESC
        LIMIT 5
      `, [blockId]);
      
      const context = contextResult.rows.reverse(); // Put in chronological order
      
      // Generate a simple response based on context
      let response = "I'm listening to your conversation. ";
      
      if (context.length === 0) {
        response += "I haven't captured any content yet - are you speaking into the microphone?";
      } else {
        const speakers = [...new Set(context.map(t => t.speaker_name))].filter(s => s);
        if (speakers.length > 1) {
          response += `I can see ${speakers.length} speakers: ${speakers.join(', ')}. `;
        }
        response += `The latest topic seems to be about ${context[context.length - 1].content.substring(0, 50)}...`;
      }
      
      console.log(`🤖 Generated response: "${response}"`);
      
      // For now, just log the response. In a full implementation, 
      // we would send this back to the meeting chat via Recall.ai API
      console.log('📤 Would send response to meeting chat:', response);
      
      // TODO: Implement actual chat response sending via Recall.ai API
      // This would require making an API call to send the response back to the meeting
      
      return res.json({ 
        success: true, 
        message: 'Question processed',
        response: response,
        context_turns: context.length
      });
    }
    
    // For other chat messages, just log them
    console.log(`💬 Chat message (not a command): "${message.content}"`);
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

// Track transcript accumulation per bot (for storage)
const transcriptBuffers = new Map();

// Track full meeting transcripts in memory (for real-time interaction)
const meetingTranscripts = new Map();

// Track last activity per meeting for inactivity detection
const meetingLastActivity = new Map();

// Voice-cue detection function
function detectSpeakerCue(text) {
  // Check for "This is [Name]" patterns
  const thisIsPattern = /(?:^|\s)this\s+is\s+([a-zA-Z\s]+?)(?:\s*[.,:;!?]|\s+(?:and|but|so|however|speaking|talking|here|now|today))/i;
  const match = text.match(thisIsPattern);
  
  if (match) {
    const speakerName = match[1].trim();
    // Filter out common false positives
    const falsePosatives = ['it', 'what', 'how', 'when', 'where', 'why', 'the', 'a', 'an', 'not', 'very', 'really', 'just', 'only'];
    if (!falsePosatives.includes(speakerName.toLowerCase())) {
      return speakerName;
    }
  }
  
  return null;
}

// Process all pending buffers when speaker changes
async function processPendingBuffers(botId, blockId) {
  console.log(`🔄 Processing pending buffers for bot ${botId} due to speaker change`);
  
  for (let [bufferKey, buffer] of transcriptBuffers.entries()) {
    if (bufferKey.startsWith(`${botId}:`) && buffer.text.trim().length > 0) {
      const speakerName = bufferKey.split(':')[1];
      
      try {
        // Get attendee info
        const attendee = await getOrCreateAttendee(blockId, speakerName);
        
        // Generate embedding using turn processor
        const wordCount = buffer.text.trim().split(/\s+/).length;
        
        // Create turn with embedding
        const turn = await turnProcessor.createTurn({
          participant_id: attendee.id,
          content: buffer.text.trim(),
          source_type: 'recall_bot',
          metadata: {
            word_count: wordCount,
            duration_seconds: Math.floor((buffer.lastTimestamp - buffer.startTimestamp) / 1000)
          }
        });
        
        // Link turn to block
        const sequenceResult = await pool.query(
          'SELECT COALESCE(MAX(sequence_order), 0) + 1 as next_order FROM conversation.block_turns WHERE block_id = $1',
          [blockId]
        );
        const nextOrder = sequenceResult.rows[0].next_order;
        
        await pool.query(
          'INSERT INTO conversation.block_turns (block_id, turn_id, sequence_order) VALUES ($1, $2, $3)',
          [blockId, turn.turn_id, nextOrder]
        );
        
        console.log(`✅ Processed buffer for ${speakerName}: ${wordCount} words`);
        
        // Clear the buffer
        transcriptBuffers.delete(bufferKey);
        
      } catch (error) {
        console.error(`❌ Error processing buffer for ${speakerName}:`, error);
      }
    }
  }
}

// Get or create attendee for a speaker
async function getOrCreateAttendee(blockId, speakerName) {
  const existingAttendee = await pool.query(
    'SELECT * FROM conversation.participants WHERE name = $1',
    [speakerName]
  );
  
  if (existingAttendee.rows.length > 0) {
    return existingAttendee.rows[0];
  }
  
  const newAttendeeResult = await pool.query(
    'INSERT INTO conversation.participants (name, email, created_at) VALUES ($1, $2, NOW()) RETURNING *',
    [speakerName, `${speakerName.toLowerCase().replace(/\s+/g, '.')}@meeting.local`]
  );
  
  return newAttendeeResult.rows[0];
}

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
    
    // Process any remaining transcript buffers
    await processPendingBuffers(botId, meeting.block_id);
    
    // Update meeting status
    await pool.query(
      `UPDATE conversation.block_meetings 
       SET status = $1, end_time = NOW(), 
           metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb
       WHERE recall_bot_id = $3`,
      ['completed', JSON.stringify({ completion_reason: reason }), botId]
    );
    
    console.log(`✅ Meeting ${botId} completed due to ${reason}`);
    
    // Clean up tracking data
    meetingLastActivity.delete(botId);
    
    // TODO: Send email transcript
    console.log(`📧 Would send transcript email to: ${meeting.transcript_email}`);
    
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
        transcriptBuffers.delete(botId);
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
          
          // Handle bot status changes
          if (message.event === 'status_changes.update' && message.data) {
            const statusData = message.data;
            const botId = statusData.bot?.id;
            const status = statusData.status;
            
            console.log(`🤖 Bot status change: ${botId} -> ${status}`);
            
            // When bot leaves or meeting ends, complete the meeting
            if (status === 'done' || status === 'left') {
              console.log(`🏁 Meeting ending - bot ${botId} status: ${status}`);
              
              // Process any remaining buffers before completing
              const meeting = await pool.query(
                'SELECT * FROM conversation.block_meetings WHERE recall_bot_id = $1',
                [botId]
              );
              
              if (meeting.rows.length > 0) {
                const meetingRecord = meeting.rows[0];
                
                // Process remaining buffers
                await processPendingBuffers(botId, meetingRecord.block_id);
                
                // Update meeting status to completed
                await pool.query(
                  'UPDATE conversation.block_meetings SET status = $1, end_time = NOW() WHERE recall_bot_id = $2',
                  ['completed', botId]
                );
                
                console.log(`✅ Meeting ${botId} marked as completed`);
                
                // TODO: Send email transcript here
                console.log(`📧 Would send transcript email to: ${meetingRecord.transcript_email}`);
              }
            }
            
            return; // Don't process as transcript data
          }
          
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
          if (!transcriptData?.words || !transcriptData?.participant) {
            console.error('❌ Invalid transcript data structure');
            return;
          }
          
          const speakerName = transcriptData.participant.name || 'Unknown Speaker';
          const words = transcriptData.words;
          
          // Get or create attendee for this speaker
          const attendee = await getOrCreateAttendee(meeting.block_id, speakerName);
          
          // Combine words into text
          const text = words.map(w => w.text).join(' ');
          const timestamp = words[0]?.start_time || Date.now();
          
          // VOICE CUE DETECTION: Check for "This is [Name]" patterns
          let actualSpeakerName = speakerName; // Default to API speaker name
          const speakerCue = detectSpeakerCue(text);
          if (speakerCue) {
            console.log(`🎤 Voice cue detected: "${speakerCue}" - processing pending buffers`);
            
            // Force buffer processing for previous speaker when new speaker starts
            await processPendingBuffers(botId, meeting.block_id);
            
            // Update speaker name for subsequent processing
            actualSpeakerName = speakerCue;
            console.log(`📝 Speaker reassigned from "${speakerName}" to "${actualSpeakerName}"`);
          }
          
          // Initialize buffer for this speaker if needed
          const bufferKey = `${botId}:${actualSpeakerName}`;
          if (!transcriptBuffers.has(bufferKey)) {
            transcriptBuffers.set(bufferKey, {
              text: '',
              startTimestamp: timestamp,
              lastTimestamp: timestamp
            });
          }
          
          const buffer = transcriptBuffers.get(bufferKey);
          buffer.text += ' ' + text;
          buffer.lastTimestamp = timestamp;
          
          // Voice-cue-only chunking with safety fallbacks
          const wordCount = buffer.text.trim().split(/\s+/).length;
          const timeSinceStart = timestamp - buffer.startTimestamp;
          
          // Safety fallbacks: process if buffer is extremely large (500+ words) or very old (5+ minutes)
          const shouldProcess = wordCount >= 500 || timeSinceStart >= 5 * 60 * 1000;
          
          if (shouldProcess) {
            console.log(`⚠️  Safety fallback triggered for ${actualSpeakerName}: ${wordCount} words, ${Math.floor(timeSinceStart/1000)}s`);
            
            // Get attendee for the actual speaker (may be different from API speaker due to voice cue)
            const actualAttendee = await getOrCreateAttendee(meeting.block_id, actualSpeakerName);
            
            // Create turn with embedding
            const turn = await turnProcessor.createTurn({
              participant_id: actualAttendee.id,
              content: buffer.text.trim(),
              source_type: 'recall_bot',
              metadata: {
                word_count: wordCount,
                duration_seconds: Math.floor(timeSinceStart / 1000),
                safety_fallback: true
              }
            });
            
            // Get next sequence order for this block
            const sequenceResult = await pool.query(
              'SELECT COALESCE(MAX(sequence_order), 0) + 1 as next_order FROM conversation.block_turns WHERE block_id = $1',
              [meeting.block_id]
            );
            const nextOrder = sequenceResult.rows[0].next_order;
            
            // Link turn to block
            await pool.query(
              'INSERT INTO conversation.block_turns (block_id, turn_id, sequence_order) VALUES ($1, $2, $3)',
              [meeting.block_id, turn.turn_id, nextOrder]
            );
            
            // Clear the buffer
            transcriptBuffers.set(bufferKey, {
              text: '',
              startTimestamp: timestamp,
              lastTimestamp: timestamp
            });
            
            console.log(`✅ Stored ${wordCount} words for ${speakerName} (safety fallback)`);
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
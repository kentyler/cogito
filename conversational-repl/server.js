require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const Anthropic = require('@anthropic-ai/sdk');
const bcrypt = require('bcrypt');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const path = require('path');
// Use global fetch available in Node.js 18+
const { createTurnProcessor } = require('./turn-processor-wrapper.cjs');
const { createSimilarityOrchestrator } = require('./similarity-orchestrator-wrapper.cjs');

// Initialize similarity orchestrator (will be set after async initialization)
let similarityOrchestrator;

const app = express();

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
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Serve static files
app.use(express.static('public'));

// Serve bot manager at /bot-manager
app.use('/bot-manager', express.static('public/bot-manager'));

// Authentication middleware
function requireAuth(req, res, next) {
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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'conversational-repl' });
});

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
    
    // Start server
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Conversational REPL server running on port ${PORT}`);
      console.log(`Access the REPL at: http://localhost:${PORT}`);
      console.log(`Access from Windows at: http://172.24.145.192:${PORT}`);
      console.log(`✅ Embeddings will be generated for new turns`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
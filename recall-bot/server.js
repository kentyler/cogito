require('dotenv').config();
const express = require('express');
const { WebSocketServer } = require('ws');
const { Pool } = require('pg');
const fetch = require('node-fetch');
const crypto = require('crypto');
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const bcrypt = require('bcrypt');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const nodemailer = require('nodemailer');
const { createBestTransporter } = require('./simple-mail-server');
const ThinkingToolsSystem = require('./thinking-tools');

const app = express();
const server = require('http').createServer(app);
const wss = new WebSocketServer({ server });

// Debug environment variables
console.log('🔍 Environment variable check:');
console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
console.log('RENDER_EXTERNAL_URL:', process.env.RENDER_EXTERNAL_URL);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('RECALL_API_KEY exists:', !!process.env.RECALL_API_KEY);
console.log('ANTHROPIC_API_KEY exists:', !!process.env.ANTHROPIC_API_KEY);

// Initialize OpenAI - with fallback for deployment issues
let openai;
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    console.log('✅ OpenAI initialized successfully');
  } else {
    console.warn('⚠️  OPENAI_API_KEY not found, OpenAI features disabled');
    openai = null;
  }
} catch (error) {
  console.warn('⚠️  OpenAI initialization failed:', error.message);
  openai = null;
}

// Initialize Claude/Anthropic
let anthropic;
try {
  if (process.env.ANTHROPIC_API_KEY) {
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
    console.log('✅ Claude/Anthropic initialized successfully');
  } else {
    console.warn('⚠️  ANTHROPIC_API_KEY not found, Claude features disabled');
    anthropic = null;
  }
} catch (error) {
  console.warn('⚠️  Claude/Anthropic initialization failed:', error.message);
  anthropic = null;
}

// Initialize PostgreSQL connection to Render database
console.log('🔄 Connecting to Render PostgreSQL database');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Always use SSL for Render PostgreSQL
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Set search path for schema access
pool.on('connect', (client) => {
  client.query('SET search_path = public, conversation, client_mgmt, tools');
});

// Initialize Thinking Tools System
let thinkingTools;
try {
  thinkingTools = new ThinkingToolsSystem(pool, anthropic);
  console.log('✅ Thinking Tools System initialized');
} catch (error) {
  console.warn('⚠️  Thinking Tools System initialization failed:', error.message);
  thinkingTools = null;
}

// Test database connection on startup
pool.connect()
  .then(client => {
    console.log('✅ PostgreSQL connected successfully');
    client.release();
  })
  .catch(err => {
    console.error('❌ PostgreSQL connection failed:', err.message);
  });

// Email configuration - multiple provider support for Render.com
let emailTransporter;

async function initializeEmailService() {
  if (process.env.SENDGRID_API_KEY) {
    // SendGrid (Render addon)
    emailTransporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
    console.log('📧 Using SendGrid email service');
  } else if (process.env.POSTMARK_API_TOKEN) {
    // Postmark
    emailTransporter = nodemailer.createTransport({
      host: 'smtp.postmarkapp.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.POSTMARK_API_TOKEN,
        pass: process.env.POSTMARK_API_TOKEN
      }
    });
    console.log('📧 Using Postmark email service');
  } else if (process.env.SMTP_HOST) {
    // Generic SMTP
    emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    console.log('📧 Using custom SMTP service');
  } else {
    // No external email service configured - use best available method
    emailTransporter = await createBestTransporter();
    console.log('📧 Email service initialized without external credentials');
  }

  // Test email configuration
  emailTransporter.verify((error, success) => {
    if (error) {
      console.log('❌ Email configuration failed:', error.message);
    } else {
      console.log('✅ Email server is ready');
    }
  });
}

// Initialize email service
initializeEmailService().catch(console.error);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Trust proxy for Render deployment
app.set('trust proxy', 1);

// Session middleware with PostgreSQL store
app.use(session({
  store: new pgSession({
    pool: pool, // Use existing PostgreSQL connection pool
    tableName: 'user_sessions', // Table will be created automatically
    createTableIfMissing: true,
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

console.log('Session config:', {
  secure: process.env.NODE_ENV === 'production',
  nodeEnv: process.env.NODE_ENV
});

// Temporary migration endpoint (remove after migration)
// const { addMigrationEndpoint } = require('./migrate-endpoint'); // File doesn't exist
// addMigrationEndpoint(app);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'cogito-recall-bot', version: '1.1' });
});

// Authentication middleware
function requireAuth(req, res, next) {
  console.log('Auth check - Session ID:', req.sessionID);
  console.log('Auth check - Session data:', req.session);
  console.log('Auth check - Has user:', !!(req.session && req.session.user));
  console.log('Auth check - Headers:', req.headers['x-user-id'], req.headers['x-user-email']);
  
  // Check session first
  if (req.session && req.session.user) {
    req.user = {
      id: req.session.user.user_id || req.session.user.id,
      email: req.session.user.email
    };
    return next();
  }
  
  // Fallback to headers from cogito-repl proxy
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
    
    // Query user from client_mgmt.users table
    console.log('Looking up user with email:', email);
    const userResult = await pool.query(
      'SELECT id, email, password_hash FROM client_mgmt.users WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))',
      [email]
    );
    
    console.log('Query returned', userResult.rows.length, 'users');
    
    if (userResult.rows.length === 0) {
      // Let's see what emails exist for debugging
      const allUsersResult = await pool.query(
        'SELECT id, email FROM client_mgmt.users WHERE id IN (1, 2)'
      );
      console.log('Available users:', allUsersResult.rows);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = userResult.rows[0];
    
    // Debug logging
    console.log('Login attempt for:', email);
    console.log('User found:', user.id, user.email);
    console.log('Has password hash:', !!user.password_hash);
    console.log('Password hash length:', user.password_hash ? user.password_hash.length : 0);
    
    // Check if user has a password hash
    if (!user.password_hash) {
      console.log('User has no password set:', user.email);
      return res.status(401).json({ error: 'User account not activated. Please contact administrator.' });
    }
    
    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    console.log('Password match result:', passwordMatch);
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Create session
    req.session.user = {
      user_id: user.id,
      email: user.email
    };
    
    // Save session explicitly
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ error: 'Session creation failed' });
      }
      
      console.log('Session saved successfully:', req.sessionID);
      console.log('Session user:', req.session.user);
      
      // Check if session was actually saved to database
      pool.query('SELECT * FROM user_sessions WHERE sid = $1', [req.sessionID])
        .then(result => {
          console.log('Session in database:', result.rows.length > 0 ? 'YES' : 'NO');
          if (result.rows.length > 0) {
            console.log('Session data:', result.rows[0].sess);
          }
        })
        .catch(err => console.error('Session check error:', err));
      
      res.json({ 
        success: true, 
        message: 'Login successful',
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
    res.json({ success: true, message: 'Logged out' });
  });
});

// Check authentication status
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

// Serve bot creator UI at /create-bot subfolder
app.use('/create-bot', express.static('public'));

// Serve conversational REPL UI at /repl
app.use('/repl', express.static('../conversational-repl/public'));

// Debug endpoint to check environment variables
app.get('/debug/env', (req, res) => {
  res.json({
    RENDER_EXTERNAL_URL: process.env.RENDER_EXTERNAL_URL || 'undefined',
    PORT: process.env.PORT || 'undefined',
    hasRecallKey: !!process.env.RECALL_API_KEY,
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    hasDatabaseURL: !!process.env.DATABASE_URL
  });
});

// Get meeting status endpoint
app.get('/api/meeting-status/:botId', requireAuth, async (req, res) => {
  try {
    const { botId } = req.params;
    
    // Get meeting info from database
    const meetingResult = await pool.query(`
      SELECT 
        bm.*,
        b.name as meeting_name,
        b.created_at as block_created_at
      FROM conversation.block_meetings bm
      JOIN conversation.blocks b ON b.block_id = bm.block_id
      WHERE bm.recall_bot_id = $1
    `, [botId]);
    
    if (meetingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    
    const meeting = meetingResult.rows[0];
    
    // Get turn count
    const turnsResult = await pool.query(`
      SELECT COUNT(*) as turn_count 
      FROM conversation.block_turns 
      WHERE block_id = $1
    `, [meeting.block_id]);
    
    // Try to get current status from Recall.ai
    let recallStatus = null;
    let recallError = null;
    try {
      const botResponse = await fetch(`https://us-west-2.recall.ai/api/v1/bot/${botId}/`, {
        headers: {
          'Authorization': `Token ${process.env.RECALL_API_KEY}`
        }
      });
      
      if (botResponse.ok) {
        const botData = await botResponse.json();
        recallStatus = {
          status: botData.status,
          meeting_url: botData.meeting_url,
          created_at: botData.created_at,
          chat_enabled: !!botData.chat
        };
      } else {
        recallError = `Recall API returned ${botResponse.status}`;
      }
    } catch (error) {
      recallError = error.message;
    }
    
    // Calculate time in current status
    const minutesInStatus = Math.round((Date.now() - new Date(meeting.created_at).getTime()) / 1000 / 60);
    
    res.json({
      meeting: {
        block_id: meeting.block_id,
        name: meeting.meeting_name,
        database_status: meeting.status,
        recall_status: recallStatus,
        recall_error: recallError,
        email_sent: meeting.email_sent,
        transcript_email: meeting.transcript_email,
        created_at: meeting.created_at,
        minutes_in_status: minutesInStatus,
        turn_count: parseInt(turnsResult.rows[0].turn_count)
      },
      recommendations: {
        should_force_send: meeting.status === 'joining' && minutesInStatus > 10 && parseInt(turnsResult.rows[0].turn_count) > 0,
        reason: meeting.status === 'joining' && minutesInStatus > 10 ? 
          `Meeting stuck in 'joining' for ${minutesInStatus} minutes` : null
      }
    });
    
  } catch (error) {
    console.error('Error checking meeting status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check transcription data endpoint
app.get('/api/check-transcription/:botId', async (req, res) => {
  try {
    const { botId } = req.params;
    
    // Get meeting info
    const meetingResult = await pool.query(
      'SELECT * FROM block_meetings WHERE recall_bot_id = $1',
      [botId]
    );
    
    if (meetingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    
    const meeting = meetingResult.rows[0];
    
    // Get attendees
    const attendeesResult = await pool.query(
      'SELECT * FROM block_attendees WHERE block_id = $1',
      [meeting.block_id]
    );
    
    // Get turns
    const turnsResult = await pool.query(
      `SELECT t.*, bt.sequence_order 
       FROM turns t
       JOIN block_turns bt ON t.turn_id = bt.turn_id
       WHERE bt.block_id = $1
       ORDER BY bt.sequence_order DESC
       LIMIT 10`,
      [meeting.block_id]
    );
    
    res.json({
      meeting: {
        block_id: meeting.block_id,
        status: meeting.status,
        created_at: meeting.created_at
      },
      attendees: attendeesResult.rows.map(a => ({
        name: a.name,
        story: a.story
      })),
      turns: turnsResult.rows.map(t => ({
        content: t.content.substring(0, 100) + '...',
        source_type: t.source_type,
        has_embedding: !!t.content_vector,
        created_at: t.created_at
      })),
      total_turns: turnsResult.rows.length
    });
    
  } catch (error) {
    console.error('Error checking transcription:', error);
    res.status(500).json({ error: error.message });
  }
});

// Track transcript accumulation per bot (for storage)
const transcriptBuffers = new Map();

// Track full meeting transcripts in memory (for real-time interaction)
const meetingTranscripts = new Map();

// Track chat message polling for each bot
const chatPollers = new Map();

class RealTimeTranscript {
  constructor(botId) {
    this.botId = botId;
    this.fullTranscript = '';
    this.messageHistory = [];
    this.participantContributions = new Map();
    this.startTime = Date.now();
    this.activeQuestions = new Map(); // Track active questions from chat
    this.lastChatMessageId = null; // Track last processed chat message
  }
  
  addMessage(speaker, text, timestamp) {
    const message = {speaker, text, timestamp, id: Date.now()};
    
    // Store in full transcript
    this.fullTranscript += `[${new Date(timestamp).toLocaleTimeString()}] ${speaker}: ${text}\n`;
    this.messageHistory.push(message);
    
    // Update participant contributions
    if (!this.participantContributions.has(speaker)) {
      this.participantContributions.set(speaker, '');
    }
    this.participantContributions.set(speaker, 
      this.participantContributions.get(speaker) + ' ' + text
    );
    
    // Voice cue detection disabled - using chat commands only
  }
  
  checkForQuestions(message) {
    const {speaker, text} = message;
    const lowerText = text.toLowerCase();
    
    // Check for start protocol: "ninety nine" or "99"
    if (/\b(ninety[\s\-]*nine|99)\b/i.test(text.replace(/[.,…!?]/g, ''))) {
      console.log(`🎯 Ninety Nine (99) detected from ${speaker} - starting question capture`);
      if (!this.activeQuestions) this.activeQuestions = new Map();
      this.activeQuestions.set(speaker, {
        startMessage: text,
        questionParts: [],  // Don't include the protocol words
        startTime: Date.now()
      });
      return;
    }
    
    // Check for end protocol: "sixty six" or "66"  
    if (/\b(sixty[\s\-]*six|66)\b/i.test(text.replace(/[.,…!?]/g, ''))) {
      if (this.activeQuestions && this.activeQuestions.has(speaker)) {
        console.log(`🏁 Sixty Six (66) detected from ${speaker} - processing complete question`);
        const questionData = this.activeQuestions.get(speaker);
        
        // Don't include the end protocol in the question
        const fullQuestion = questionData.questionParts.join(' ').trim();
        
        if (fullQuestion) {
          this.handleQuestionToClaude(speaker, fullQuestion);
        } else {
          console.log(`⚠️  No question content captured for ${speaker}`);
        }
        
        // Clear the active question
        this.activeQuestions.delete(speaker);
      }
      return;
    }
    
    // If we have an active question for this speaker, add to it
    if (this.activeQuestions && this.activeQuestions.has(speaker)) {
      console.log(`📝 Adding to active question from ${speaker}: ${text}`);
      this.activeQuestions.get(speaker).questionParts.push(text);
    }
  }
  
  async handleQuestionToClaude(speaker, questionText) {
    try {
      // Get recent context (last 500 words)
      const context = this.getRecentContext(500);
      
      console.log(`🧠 Processing question for Claude: "${questionText}"`);
      console.log(`📝 Context length: ${context.length} characters`);
      
      // Save the question as a turn
      await this.saveTurnToDatabase(speaker, questionText, 'chat-question');
      
      // Get Claude response
      const response = await this.queryClaudeWithContext(speaker, questionText, context);
      
      // Save Claude response as a turn
      await this.saveTurnToDatabase('Cogito', response, 'claude-response');
      
      // Send response to meeting chat
      await this.sendChatResponse(response);
      
    } catch (error) {
      console.error('Error handling Claude question:', error);
    }
  }
  
  async handleContextualQuestion(speaker) {
    try {
      // Get recent conversation transcript (what was actually spoken)
      const transcriptContext = this.getRecentContext(500);
      
      console.log(`❓ Processing contextual '?' trigger from ${speaker}`);
      console.log(`📝 Analyzing recent conversation transcript: ${transcriptContext.length} characters`);
      
      // Save the trigger as a turn
      await this.saveTurnToDatabase(speaker, '?', 'contextual-trigger');
      
      // Get meeting info for thinking tools analysis
      const meetingResult = await pool.query(
        'SELECT * FROM block_meetings WHERE recall_bot_id = $1',
        [this.botId]
      );
      
      let response;
      
      if (meetingResult.rows.length > 0 && thinkingTools) {
        const meeting = meetingResult.rows[0];
        
        // Analyze the spoken conversation for thinking tool patterns
        console.log('🔧 Analyzing spoken conversation for thinking tool patterns...');
        const analysis = await thinkingTools.analyzeConversationPatterns(transcriptContext, meeting.block_id);
        
        if (analysis.patterns_detected && analysis.patterns_detected.length > 0) {
          console.log(`🎯 Detected patterns in conversation: ${analysis.patterns_detected.join(', ')}`);
          console.log(`🎯 Analysis reasoning: ${analysis.reasoning}`);
          
          // Get client ID (assuming invited_by_user_id maps to client somehow)
          // For now, use a default client ID of 1
          const clientId = 1;
          
          // Find available tools for these patterns
          const availableTools = await thinkingTools.findToolsForPatterns(analysis.patterns_detected, clientId);
          const accessibleTools = availableTools.filter(tool => tool.has_access);
          
          if (accessibleTools.length > 0) {
            console.log(`🔧 Found ${accessibleTools.length} applicable tools for conversation patterns`);
            
            // Generate tool suggestion based on what was actually said
            const toolSuggestion = await thinkingTools.generateToolSuggestion(
              analysis.patterns_detected,
              accessibleTools,
              transcriptContext
            );
            
            if (toolSuggestion) {
              response = toolSuggestion;
              console.log(`🎯 Suggesting thinking tool based on conversation: ${accessibleTools[0].tool_name}`);
            } else {
              // Fall back to regular contextual response about the conversation
              response = await this.queryClaudeContextually(speaker, transcriptContext);
            }
          } else {
            console.log('🔧 No accessible tools found for detected conversation patterns');
            response = await this.queryClaudeContextually(speaker, transcriptContext);
          }
        } else {
          console.log('🔧 No thinking tool patterns detected in conversation');
          response = await this.queryClaudeContextually(speaker, transcriptContext);
        }
      } else {
        // Fall back to regular contextual response if tools not available
        response = await this.queryClaudeContextually(speaker, transcriptContext);
      }
      
      // Save response as a turn
      await this.saveTurnToDatabase('Cogito', response, 'claude-response');
      
      // Send response to meeting chat
      await this.sendChatResponse(response);
      
    } catch (error) {
      console.error('Error handling contextual question:', error);
    }
  }
  
  getRecentContext(wordLimit = 500) {
    const words = this.fullTranscript.split(' ');
    return words.slice(-wordLimit).join(' ');
  }
  
  getParticipants() {
    return Array.from(this.participantContributions.keys());
  }
  
  getMeetingDuration() {
    return Math.round((Date.now() - this.startTime) / 1000 / 60); // minutes
  }
  
  async queryClaudeWithContext(speaker, questionText, context) {
    try {
      if (!anthropic) {
        console.log(`⚠️  Claude not available, using fallback response`);
        return `Hi ${speaker}! I heard your question but Claude API is not configured. Please check the ANTHROPIC_API_KEY.`;
      }

      console.log(`🧠 Asking Claude: "${questionText}" with ${context.length} chars of context`);
      
      // Prepare context for Claude
      const meetingContext = context.trim();
      const participants = this.getParticipants().join(', ');
      const duration = this.getMeetingDuration();
      
      const prompt = `You are Cogito, an AI assistant participating in a live meeting via a bot. Here's the context:

MEETING PARTICIPANTS: ${participants}
MEETING DURATION: ${duration} minutes
RECENT CONVERSATION:
${meetingContext}

CURRENT QUESTION from ${speaker}: ${questionText}

Please respond helpfully as a meeting participant. Be conversational and reference the meeting context when relevant.`;

      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const claudeResponse = response.content[0].text;
      console.log(`✅ Claude responded: ${claudeResponse.substring(0, 100)}...`);
      
      return claudeResponse;
      
    } catch (error) {
      console.error('Error querying Claude:', error);
      return `Sorry ${speaker}, I had trouble processing your question with Claude. Error: ${error.message}`;
    }
  }
  
  async queryClaudeContextually(speaker, context) {
    try {
      if (!anthropic) {
        console.log(`⚠️  Claude not available, using fallback response`);
        return `Hi ${speaker}! I heard the conversation but Claude API is not configured. Please check the ANTHROPIC_API_KEY.`;
      }

      console.log(`❓ Asking Claude for contextual response with ${context.length} chars of context`);
      
      // Prepare context for Claude
      const meetingContext = context.trim();
      const participants = this.getParticipants().join(', ');
      const duration = this.getMeetingDuration();
      
      const prompt = `You are Cogito, an AI assistant participating in a live meeting via a bot. ${speaker} just typed "?" which means they want your perspective on the current conversation.

MEETING PARTICIPANTS: ${participants}
MEETING DURATION: ${duration} minutes
RECENT CONVERSATION:
${meetingContext}

${speaker} is asking for your thoughts on what's being discussed right now. Provide a helpful perspective, insight, or relevant contribution to the conversation. You've been listening to everything, so respond as if you're a thoughtful meeting participant who has something valuable to add.

Be conversational and focus on what would be most helpful given the current discussion.`;

      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const claudeResponse = response.content[0].text;
      console.log(`✅ Claude responded contextually: ${claudeResponse.substring(0, 100)}...`);
      
      return claudeResponse;
      
    } catch (error) {
      console.error('Error querying Claude contextually:', error);
      return `Sorry ${speaker}, I had trouble providing a contextual response. Error: ${error.message}`;
    }
  }
  
  async saveTurnToDatabase(speaker, content, sourceType) {
    try {
      // Get meeting info for this bot
      const meetingResult = await pool.query(
        'SELECT * FROM block_meetings WHERE recall_bot_id = $1',
        [this.botId]
      );
      
      if (meetingResult.rows.length === 0) {
        console.error(`No meeting found for bot ${this.botId}`);
        return;
      }
      
      const meeting = meetingResult.rows[0];
      
      // Get or create attendee
      const attendee = await getOrCreateAttendee(meeting.block_id, speaker);
      
      // Insert turn
      const turnResult = await pool.query(
        'INSERT INTO conversation.turns (participant_id, content, source_type, metadata) VALUES ($1, $2, $3, $4) RETURNING turn_id, created_at',
        [attendee.id, content, sourceType, { 
          bot_id: this.botId, 
          block_id: meeting.block_id,
          chat_interaction: true 
        }]
      );
      
      const turn = turnResult.rows[0];
      
      // Get next sequence order
      const sequenceResult = await pool.query(
        'SELECT COALESCE(MAX(sequence_order), 0) + 1 as next_order FROM block_turns WHERE block_id = $1',
        [meeting.block_id]
      );
      
      // Link turn to meeting block
      await pool.query(
        'INSERT INTO block_turns (block_id, turn_id, sequence_order) VALUES ($1, $2, $3)',
        [meeting.block_id, turn.turn_id, sequenceResult.rows[0].next_order]
      );
      
      console.log(`💾 Saved ${sourceType} turn to database for ${speaker}`);
      
    } catch (error) {
      console.error('Error saving turn to database:', error);
    }
  }

  async sendChatResponse(responseText) {
    try {
      // Send chat message via Recall.ai bot
      const chatResponse = await fetch(`https://us-west-2.recall.ai/api/v1/bot/${this.botId}/send_chat_message/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${process.env.RECALL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `🤖 Cogito: ${responseText}`
        })
      });
      
      if (chatResponse.ok) {
        console.log(`✅ Sent chat response: ${responseText.substring(0, 50)}...`);
      } else {
        const error = await chatResponse.text();
        console.error('Failed to send chat message:', error);
      }
      
    } catch (error) {
      console.error('Error sending chat response:', error);
    }
  }
}

// WebSocket handler for real-time transcription
wss.on('connection', (ws, req) => {
  console.log('Recall.ai bot connected for real-time transcription');
  let currentBotId = null;
  
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('Received transcript:', message);
      
      // Extract bot_id from the nested structure
      const botId = message.data?.bot?.id;
      if (!botId) {
        console.error('No bot ID found in transcript message');
        return;
      }
      
      // Start chat polling when we first get a bot ID
      if (!currentBotId) {
        currentBotId = botId;
        console.log('💬 Starting chat polling for Google Meet - chat interaction supported');
        // Note: Removed chat polling in favor of webhooks - see /webhook/chat endpoint
      }
      
      // Find the meeting by recall_bot_id
      const meetingResult = await pool.query(
        'SELECT block_id FROM block_meetings WHERE recall_bot_id = $1',
        [botId]
      );
      const meeting = meetingResult.rows[0];
      
      if (!meeting) {
        console.error('No meeting found for bot:', botId);
        return;
      }
      
      // Extract transcript data from the nested structure
      const transcriptData = message.data?.data;
      if (!transcriptData?.words || !transcriptData?.participant) {
        console.error('Invalid transcript data structure');
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
      const speakerCue = detectSpeakerCue(text);
      if (speakerCue) {
        console.log(`🎤 Speaker cue detected: "${speakerCue.phrase}" -> ${speakerCue.detectedName}`);
        
        // If detected name differs from Recall.ai's speaker name, log for analysis
        if (speakerCue.detectedName.toLowerCase() !== speakerName.toLowerCase()) {
          console.log(`📝 Name mismatch: Recall.ai="${speakerName}" vs Voice="${speakerCue.detectedName}"`);
        }
        
        // Force buffer processing for previous speaker when new speaker starts
        await processPendingBuffers(botId, meeting.block_id);
      }
      
      // REAL-TIME: Add to full transcript and check for questions
      console.log(`📝 Processing real-time message: "${text}" from ${speakerName}`);
      if (!meetingTranscripts.has(botId)) {
        console.log(`🆕 Creating new real-time transcript for bot ${botId}`);
        meetingTranscripts.set(botId, new RealTimeTranscript(botId));
      }
      const realTimeTranscript = meetingTranscripts.get(botId);
      realTimeTranscript.addMessage(speakerName, text, timestamp);
      
      // Initialize buffer for this speaker if needed
      const bufferKey = `${botId}:${speakerName}`;
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
      const timeSinceLastUpdate = timestamp - buffer.lastTimestamp;
      const timeSinceStart = timestamp - buffer.startTimestamp;
      
      // Safety fallbacks: process if buffer is extremely large (500+ words) or very old (5+ minutes)
      const shouldProcess = wordCount >= 500 || timeSinceStart >= 5 * 60 * 1000;
      
      if (shouldProcess && buffer.text.trim().length > 0) {
        // Generate embedding for the accumulated text
        const embedding = await generateEmbedding(buffer.text.trim());
        
        // Create a turn for this chunk (without embedding for now)
        const turnResult = await pool.query(
          `INSERT INTO turns (participant_id, content, source_type, metadata) 
           VALUES ($1, $2, $3, $4) RETURNING turn_id`,
          [
            attendee.id,
            buffer.text.trim(),
            'recall_bot',
            { 
              startTimestamp: buffer.startTimestamp,
              endTimestamp: buffer.lastTimestamp,
              bot_id: botId,
              word_count: wordCount,
              has_embedding: !!embedding
            }
          ]
        );
        const turn = turnResult.rows[0];
        
        // Clear the buffer
        transcriptBuffers.set(bufferKey, {
          text: '',
          startTimestamp: timestamp,
          lastTimestamp: timestamp
        });
        
        // Get next sequence order for this block
        const sequenceResult = await pool.query(
          'SELECT COALESCE(MAX(sequence_order), 0) + 1 as next_order FROM block_turns WHERE block_id = $1',
          [meeting.block_id]
        );
        
        // Link turn to the meeting block
        await pool.query(
          'INSERT INTO block_turns (block_id, turn_id, sequence_order) VALUES ($1, $2, $3)',
          [meeting.block_id, turn.turn_id, sequenceResult.rows[0].next_order]
        );
        
        console.log(`Stored ${wordCount} words for ${speakerName}`);
      }
      
    } catch (error) {
      console.error('Error processing transcript:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('Recall.ai bot disconnected');
    // Stop chat polling when bot disconnects
    if (currentBotId && chatPollers.has(currentBotId)) {
      clearInterval(chatPollers.get(currentBotId));
      chatPollers.delete(currentBotId);
      console.log(`Stopped chat polling for bot ${currentBotId}`);
    }
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Chat polling function
async function startChatPolling(botId) {
  console.log(`Starting chat polling for bot ${botId}`);
  
  const pollInterval = setInterval(async () => {
    try {
      // First, let's check the bot details 
      const botResponse = await fetch(`https://us-west-2.recall.ai/api/v1/bot/${botId}/`, {
        headers: {
          'Authorization': `Token ${process.env.RECALL_API_KEY}`
        }
      });
      
      if (!botResponse.ok) {
        console.log(`Bot ${botId} details fetch failed: ${botResponse.status}`);
        return;
      }
      
      const botData = await botResponse.json();
      console.log(`🤖 Bot ${botId} full data:`, JSON.stringify(botData, null, 2));
      console.log(`Bot ${botId} status: ${botData.status}, chat enabled: ${!!botData.chat}`);
      
      // Use the new participant_events endpoint instead of legacy chat-messages
      // Get the participant_events ID from the bot data
      const participantEventsId = botData.recordings?.[0]?.media_shortcuts?.participant_events?.id;
      const participantEventsStatus = botData.recordings?.[0]?.media_shortcuts?.participant_events?.status?.code;
      
      if (!participantEventsId) {
        console.log(`⚠️  No participant_events ID found for bot ${botId}`);
        return;
      }
      
      if (participantEventsStatus !== 'completed') {
        console.log(`⏳ Participant events still ${participantEventsStatus} for bot ${botId}, skipping this poll`);
        return;
      }
      
      // Try both endpoint formats since documentation shows different regions
      const endpoints = [
        `https://us-east-1.recall.ai/api/v1/participant_events/${participantEventsId}/`,
        `https://us-west-2.recall.ai/api/v1/participant_events/${participantEventsId}/`
      ];
      
      let response = null;
      let workingEndpoint = null;
      
      for (const endpoint of endpoints) {
        console.log(`🔍 Trying participant events endpoint: ${endpoint}`);
        try {
          response = await fetch(endpoint, {
            headers: {
              'Authorization': `Token ${process.env.RECALL_API_KEY}`
            }
          });
          
          if (response.ok) {
            workingEndpoint = endpoint;
            console.log(`✅ Working participant events endpoint: ${endpoint}`);
            break;
          } else {
            console.log(`❌ ${endpoint} returned ${response.status}`);
          }
        } catch (e) {
          console.log(`❌ ${endpoint} failed: ${e.message}`);
        }
      }
      
      if (!workingEndpoint) {
        console.log(`⚠️  No working participant events endpoint found for bot ${botId}`);
        return;
      }
      
      const participantEventsData = await response.json();
      console.log(`📊 Participant events data:`, JSON.stringify(participantEventsData, null, 2));
      
      // Extract chat messages from participant events
      // The new format likely has chat messages in a different structure
      const chatMessages = participantEventsData.chat_messages || participantEventsData.messages || [];
      
      console.log(`📊 Found ${chatMessages.length} total chat messages`);
      
      // Get the real-time transcript for this bot
      const realTimeTranscript = meetingTranscripts.get(botId);
      if (!realTimeTranscript) return;
      
      // Process new chat messages
      const newMessages = chatMessages.filter(msg => {
        // Only process messages after the last processed one
        if (!realTimeTranscript.lastChatMessageId) return true;
        return msg.id > realTimeTranscript.lastChatMessageId;
      });
      
      console.log(`📥 Processing ${newMessages.length} new chat messages`);
      
      for (const message of newMessages) {
        await processChatMessage(botId, message, realTimeTranscript);
        realTimeTranscript.lastChatMessageId = message.id;
      }
      
    } catch (error) {
      console.error(`Error polling chat for bot ${botId}:`, error);
    }
  }, 5000); // Poll every 5 seconds
  
  chatPollers.set(botId, pollInterval);
}

// Process individual chat message for @cc commands
async function processChatMessage(botId, message, realTimeTranscript) {
  const content = message.content?.trim();
  const sender = message.sender?.name || 'Unknown';
  
  console.log(`💬 Chat message from ${sender}: "${content}"`);
  
  // Check for simple ? trigger (just a question mark, possibly with whitespace)
  if (content === '?' || content.match(/^\s*\?\s*$/)) {
    console.log(`❓ Simple '?' trigger from ${sender} - responding to current conversation context`);
    await realTimeTranscript.handleContextualQuestion(sender);
    return;
  }
  
  // Check for @cc pattern anywhere in the message
  const ccPattern = /@cc/gi;
  const ccMatches = content.match(ccPattern);
  
  if (ccMatches) {
    // Check if this is a single-line question: "@cc question text @cc"
    if (ccMatches.length >= 2) {
      // Extract question between first and last @cc
      const parts = content.split(/@cc/i);
      if (parts.length >= 3) {
        // Get the middle part(s) - everything between first and last @cc
        const questionText = parts.slice(1, -1).join('@cc').trim();
        
        if (questionText) {
          console.log(`🎯 Single-line @cc question from ${sender}: "${questionText}"`);
          await realTimeTranscript.handleQuestionToClaude(sender, questionText);
          return;
        }
      }
    }
    
    // Handle single @cc (start or end of multi-message question)
    if (ccMatches.length === 1) {
      if (realTimeTranscript.activeQuestions.has(sender)) {
        // End question capture - extract any text before/after @cc
        console.log(`🏁 @cc END detected from ${sender} - processing complete question`);
        const questionData = realTimeTranscript.activeQuestions.get(sender);
        
        // Add any text from this message (excluding @cc)
        const textWithoutCc = content.replace(/@cc/i, '').trim();
        if (textWithoutCc) {
          questionData.questionParts.push(textWithoutCc);
        }
        
        const fullQuestion = questionData.questionParts.join(' ').trim();
        
        if (fullQuestion) {
          await realTimeTranscript.handleQuestionToClaude(sender, fullQuestion);
        } else {
          console.log(`⚠️  No question content captured for ${sender}`);
        }
        
        realTimeTranscript.activeQuestions.delete(sender);
      } else {
        // Start question capture - extract any text after @cc
        console.log(`🎯 @cc START detected from ${sender} - starting question capture`);
        const textWithoutCc = content.replace(/@cc/i, '').trim();
        
        realTimeTranscript.activeQuestions.set(sender, {
          startMessage: content,
          questionParts: textWithoutCc ? [textWithoutCc] : [],
          startTime: Date.now()
        });
      }
    }
  } else {
    // Check if this is a question part for an active question
    if (realTimeTranscript.activeQuestions.has(sender)) {
      console.log(`📝 Adding chat content to question from ${sender}: ${content}`);
      realTimeTranscript.activeQuestions.get(sender).questionParts.push(content);
    } else {
      // Regular chat comment - save as turn
      console.log(`💾 Saving regular chat comment from ${sender}`);
      await realTimeTranscript.saveTurnToDatabase(sender, content, 'chat-comment');
    }
  }
}

// Helper function to generate embedding for text
// Voice cue detection for speaker changes
function detectSpeakerCue(text) {
  const patterns = [
    /this is (\w+)/i,
    /(\w+) here/i,
    /my name is (\w+)/i,
    /i'm (\w+)/i,
    /^(\w+):/,
    /(\w+) speaking/i
  ];
  
  for (let pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        phrase: match[0],
        detectedName: match[1],
        position: match.index,
        confidence: getConfidenceScore(match[0], pattern)
      };
    }
  }
  return null;
}

function getConfidenceScore(phrase, pattern) {
  // "This is X" gets highest confidence
  if (pattern.source.includes('this is')) return 0.9;
  if (pattern.source.includes('my name is')) return 0.8;
  if (pattern.source.includes('speaking')) return 0.7;
  if (pattern.source.includes('here')) return 0.6;
  if (pattern.source.includes('^')) return 0.5; // Start of line patterns
  return 0.4;
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
        
        // Generate embedding
        const embedding = await generateEmbedding(buffer.text.trim());
        
        // Create turn
        const wordCount = buffer.text.trim().split(/\s+/).length;
        const turnResult = await pool.query(
          `INSERT INTO turns (participant_id, content, source_type, metadata) 
           VALUES ($1, $2, $3, $4) RETURNING turn_id`,
          [
            attendee.id,
            buffer.text.trim(),
            'recall_bot_speaker_change',
            { 
              startTimestamp: buffer.startTimestamp,
              endTimestamp: buffer.lastTimestamp,
              bot_id: botId,
              word_count: wordCount,
              has_embedding: !!embedding,
              trigger: 'speaker_cue_detected'
            }
          ]
        );
        
        if (embedding) {
          await pool.query(
            'UPDATE turns SET content_embedding = $1 WHERE turn_id = $2',
            [embedding, turnResult.rows[0].turn_id]
          );
        }
        
        console.log(`✅ Processed buffer for ${speakerName}: ${wordCount} words`);
        
        // Clear the buffer
        transcriptBuffers.delete(bufferKey);
        
      } catch (error) {
        console.error(`❌ Error processing buffer for ${speakerName}:`, error);
      }
    }
  }
}

async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      dimensions: 1536
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return null;
  }
}

// Helper function to get or create attendee
async function getOrCreateAttendee(blockId, speakerName) {
  // Check if attendee already exists for this meeting
  const attendeeResult = await pool.query(
    'SELECT * FROM block_attendees WHERE block_id = $1 AND name = $2',
    [blockId, speakerName]
  );
  
  if (attendeeResult.rows.length > 0) {
    return attendeeResult.rows[0];
  }
  
  // Create new attendee
  const newAttendeeResult = await pool.query(
    `INSERT INTO block_attendees (block_id, name, story) 
     VALUES ($1, $2, $3) RETURNING *`,
    [blockId, speakerName, `${speakerName} joined the meeting.`]
  );
  
  return newAttendeeResult.rows[0];
}

// Function to send transcript email
async function sendTranscriptEmail(blockId, userEmail, meetingUrl, meetingName) {
  try {
    console.log(`Sending transcript email to ${userEmail} for meeting ${blockId}`);
    
    // Get all turns for this meeting in sequence order
    const turns = await pool.query(`
      SELECT 
        t.content,
        t.source_type,
        t.timestamp,
        t.participant_id,
        t.metadata,
        bt.sequence_order,
        p.name as participant_name,
        ba.name as attendee_name
      FROM conversation.turns t
      JOIN conversation.block_turns bt ON bt.turn_id = t.turn_id
      LEFT JOIN conversation.participants p ON p.id = t.participant_id
      LEFT JOIN conversation.block_attendees ba ON ba.block_id = bt.block_id 
        AND ba.name = t.metadata->>'speaker'
      WHERE bt.block_id = $1
      ORDER BY bt.sequence_order
    `, [blockId]);
    
    if (turns.rows.length === 0) {
      console.log('No transcript content found for meeting');
      return;
    }
    
    // Generate email content
    const speechTurns = turns.rows.filter(t => t.source_type === 'recall_bot');
    const chatTurns = turns.rows.filter(t => ['chat-question', 'chat-comment', 'claude-response'].includes(t.source_type));
    
    let emailContent = `
    <h2>Meeting Transcript</h2>
    <p><strong>Meeting:</strong> ${meetingName || 'Unnamed Meeting'}</p>
    <p><strong>Date:</strong> ${new Date(turns.rows[0].timestamp).toLocaleString()}</p>
    <p><strong>URL:</strong> <a href="${meetingUrl}">${meetingUrl}</a></p>
    <p><strong>Total Activity:</strong> ${turns.rows.length} turns (${speechTurns.length} speech, ${chatTurns.length} chat)</p>
    
    <hr>
    
    <h3>Complete Transcript</h3>
    `;
    
    // Add all turns in chronological order
    for (const turn of turns.rows) {
      const timestamp = new Date(turn.timestamp).toLocaleTimeString();
      
      if (turn.source_type === 'recall_bot') {
        // Speech turn
        const speaker = turn.metadata?.speaker || turn.attendee_name || turn.participant_name || 'Unknown Speaker';
        emailContent += `
        <div style="margin-bottom: 15px;">
          <strong>[${timestamp}] ${speaker}:</strong><br>
          ${turn.content.replace(/\n/g, '<br>')}
        </div>
        `;
      } else {
        // Chat turn
        const chatter = turn.participant_name || 'Unknown';
        const chatType = turn.source_type === 'claude-response' ? 'AI Response' : 'Chat';
        emailContent += `
        <div style="margin-bottom: 15px; background-color: #f0f8ff; padding: 10px; border-left: 3px solid #2563eb;">
          <strong>[${timestamp}] 💬 ${chatter} (${chatType}):</strong><br>
          ${turn.content.replace(/\n/g, '<br>')}
        </div>
        `;
      }
    }
    
    // Calculate stats
    const totalWords = turns.rows.reduce((sum, turn) => sum + turn.content.split(/\s+/).length, 0);
    
    emailContent += `
    <hr>
    <p><strong>Statistics:</strong></p>
    <ul>
      <li>Total words: ${totalWords}</li>
      <li>Speech turns: ${speechTurns.length}</li>
      <li>Chat interactions: ${chatTurns.length}</li>
      <li>Duration: ${new Date(turns.rows[0].timestamp).toLocaleString()} - ${new Date(turns.rows[turns.rows.length - 1].timestamp).toLocaleString()}</li>
    </ul>
    
    <p><em>This transcript was automatically generated by Cogito Meeting Bot.</em></p>
    `;
    
    // Send email
    const fromEmail = process.env.FROM_EMAIL || 
                     process.env.EMAIL_USER || 
                     'cogito@cogito-meetings.onrender.com';
    
    const mailOptions = {
      from: fromEmail,
      to: userEmail,
      subject: `Meeting Transcript - ${meetingName || 'Unnamed Meeting'}`,
      html: emailContent
    };
    
    await emailTransporter.sendMail(mailOptions);
    console.log(`✅ Transcript email sent successfully to ${userEmail}`);
    
    // Mark as sent in database
    await pool.query(`
      UPDATE conversation.block_meetings 
      SET email_sent = TRUE 
      WHERE block_id = $1
    `, [blockId]);
    
  } catch (error) {
    console.error('Error sending transcript email:', error);
  }
}

// API endpoint to force send transcript for a stuck meeting
app.post('/api/force-send-transcript/:botId', requireAuth, async (req, res) => {
  try {
    const { botId } = req.params;
    
    // Get meeting info
    const meetingResult = await pool.query(`
      SELECT 
        bm.block_id,
        bm.transcript_email,
        bm.meeting_url,
        bm.email_sent,
        bm.status,
        b.name as meeting_name
      FROM conversation.block_meetings bm
      JOIN conversation.blocks b ON b.block_id = bm.block_id
      WHERE bm.recall_bot_id = $1
    `, [botId]);
    
    if (meetingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    
    const meeting = meetingResult.rows[0];
    
    if (meeting.email_sent) {
      return res.status(400).json({ error: 'Transcript already sent' });
    }
    
    if (!meeting.transcript_email) {
      return res.status(400).json({ error: 'No email address configured for this meeting' });
    }
    
    // Check if we have any transcript data
    const turnsCheck = await pool.query(`
      SELECT COUNT(*) as turn_count 
      FROM conversation.block_turns 
      WHERE block_id = $1
    `, [meeting.block_id]);
    
    const turnCount = parseInt(turnsCheck.rows[0].turn_count);
    
    if (turnCount === 0) {
      return res.status(400).json({ error: 'No transcript data available' });
    }
    
    // Force send the transcript
    await sendTranscriptEmail(
      meeting.block_id,
      meeting.transcript_email,
      meeting.meeting_url,
      meeting.meeting_name
    );
    
    res.json({ 
      success: true, 
      message: `Transcript sent to ${meeting.transcript_email}`,
      turns_sent: turnCount
    });
    
  } catch (error) {
    console.error('Error forcing transcript send:', error);
    res.status(500).json({ error: 'Failed to send transcript' });
  }
});

// API endpoint to create a meeting bot (protected)
// Get all bots for the authenticated user
app.get('/api/bots', requireAuth, async (req, res) => {
  try {
    const result = await db.pool.query(`
      SELECT 
        b.id,
        b.bot_id,
        b.meeting_url,
        b.meeting_name,
        b.status,
        b.created_at,
        b.updated_at
      FROM blocks b
      WHERE b.participant_id = $1
        AND b.bot_id IS NOT NULL
        AND b.status IN ('active', 'joining', 'leaving')
      ORDER BY b.created_at DESC
    `, [req.user.id]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching bots:', error);
    res.status(500).json({ error: 'Failed to fetch bots' });
  }
});

// Test endpoint for debugging - remove after fixing
app.get('/api/stuck-meetings-debug', async (req, res) => {
  try {
    console.log('Debug: Fetching stuck meetings...');
    const result = await db.pool.query(`
      SELECT 
        bm.id,
        bm.meeting_id,
        bm.meeting_url,
        bm.meeting_name,
        bm.status,
        bm.created_at,
        bm.updated_at,
        b.bot_id,
        COALESCE(COUNT(t.id), 0) as turn_count
      FROM block_meetings bm
      LEFT JOIN blocks b ON bm.block_id = b.id
      LEFT JOIN turns t ON b.id = t.block_id
      WHERE bm.status = 'joining'
      GROUP BY bm.id, bm.meeting_id, bm.meeting_url, bm.meeting_name, bm.status, bm.created_at, bm.updated_at, b.bot_id
      ORDER BY bm.created_at DESC
    `);
    
    console.log('Debug: Found stuck meetings:', result.rows.length);
    console.log('Debug: Stuck meetings data:', result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error('Debug: Error fetching stuck meetings:', error);
    res.status(500).json({ error: 'Failed to fetch stuck meetings' });
  }
});

// Get stuck meetings (meetings stuck in 'joining' status) - temporarily without auth
app.get('/api/stuck-meetings', async (req, res) => {
  try {
    console.log('Fetching stuck meetings...');
    const result = await db.pool.query(`
      SELECT 
        bm.id,
        bm.meeting_id,
        bm.meeting_url,
        bm.meeting_name,
        bm.status,
        bm.created_at,
        bm.updated_at,
        b.bot_id,
        COALESCE(COUNT(t.id), 0) as turn_count
      FROM block_meetings bm
      LEFT JOIN blocks b ON bm.block_id = b.id
      LEFT JOIN turns t ON b.id = t.block_id
      WHERE bm.status = 'joining'
      GROUP BY bm.id, bm.meeting_id, bm.meeting_url, bm.meeting_name, bm.status, bm.created_at, bm.updated_at, b.bot_id
      ORDER BY bm.created_at DESC
    `);
    
    console.log('Found stuck meetings:', result.rows.length);
    console.log('Stuck meetings data:', result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching stuck meetings:', error);
    res.status(500).json({ error: 'Failed to fetch stuck meetings' });
  }
});

// Force complete a stuck meeting
app.post('/api/stuck-meetings/:meetingId/complete', requireAuth, async (req, res) => {
  try {
    const { meetingId } = req.params;
    
    // Update the meeting status to completed
    const result = await db.pool.query(`
      UPDATE block_meetings 
      SET status = 'completed', updated_at = NOW()
      WHERE meeting_id = $1
      RETURNING *
    `, [meetingId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    
    // Also update the associated block status if it exists
    await db.pool.query(`
      UPDATE blocks 
      SET status = 'completed', updated_at = NOW()
      WHERE id = (
        SELECT block_id FROM block_meetings WHERE meeting_id = $1
      )
    `, [meetingId]);
    
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

// Leave/shutdown a bot
app.post('/api/bots/:botId/leave', requireAuth, async (req, res) => {
  try {
    const { botId } = req.params;
    
    // Update the bot status to leaving
    await db.pool.query(`
      UPDATE blocks 
      SET status = 'leaving', updated_at = NOW()
      WHERE bot_id = $1 AND participant_id = $2
    `, [botId, req.user.id]);
    
    // Here you would typically call the Recall API to actually leave the meeting
    // For now, we'll just simulate it by updating the status
    setTimeout(async () => {
      try {
        await db.pool.query(`
          UPDATE blocks 
          SET status = 'inactive', updated_at = NOW()
          WHERE bot_id = $1 AND participant_id = $2
        `, [botId, req.user.id]);
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

app.post('/api/create-bot', requireAuth, async (req, res) => {
  try {
    const { meeting_url, client_id, meeting_name } = req.body;
    
    if (!meeting_url) {
      return res.status(400).json({ error: 'meeting_url is required' });
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
      websocketUrl = `ws://localhost:${process.env.PORT || 8080}/transcript`;
      webhookUrl = `http://localhost:${process.env.PORT || 8080}/webhook/chat`;
    }
    
    console.log('WebSocket URL for real-time transcription:', websocketUrl);
    console.log('Webhook URL for chat messages:', webhookUrl);
    
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
        webhook_url: `https://${process.env.RENDER_EXTERNAL_URL.replace(/^https?:\/\//, '')}/webhook`
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
        req.session.user.user_id,
        { created_by: 'recall_bot', recall_bot_id: botData.id }
      ]
    );
    const block = blockResult.rows[0];
    console.log('Block created:', block.block_id);
    
    // Create meeting-specific data
    // Use authenticated user's ID and email
    const invitedByUserId = req.session.user.user_id;
    const userEmail = req.session.user.email;
    
    const meetingResult = await pool.query(
      `INSERT INTO block_meetings (block_id, recall_bot_id, meeting_url, invited_by_user_id, transcript_email, status) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [block.block_id, botData.id, meeting_url, invitedByUserId, userEmail, 'joining']
    );
    const meeting = meetingResult.rows[0];
    console.log('Meeting record created:', meeting.block_id);
    
    res.json({
      bot: botData,
      meeting: meeting,
      block: block
    });
    
  } catch (error) {
    console.error('Error creating bot:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
});

// Webhook endpoint for bot status updates
app.post('/webhook', async (req, res) => {
  try {
    const event = req.body;
    console.log('Webhook received:', event);
    
    // Update meeting status
    if (event.bot_id) {
      const updateData = { 
        status: event.status,
        updated_at: new Date().toISOString()
      };
      
      if (event.status === 'completed') {
        updateData.ended_at = new Date().toISOString();
        
        // Fetch complete transcript from Recall.ai
        try {
          const transcriptResponse = await fetch(`https://us-west-2.recall.ai/api/v1/bot/${event.bot_id}/transcript/`, {
            headers: {
              'Authorization': `Token ${process.env.RECALL_API_KEY}`
            }
          });
          
          if (transcriptResponse.ok) {
            const fullTranscript = await transcriptResponse.json();
            updateData.full_transcript = fullTranscript;
            console.log('Stored complete transcript for bot:', event.bot_id);
          } else {
            console.error('Failed to fetch transcript:', transcriptResponse.status);
          }
        } catch (error) {
          console.error('Error fetching transcript:', error);
        }
      }
      
      const updateFields = Object.keys(updateData).map((key, i) => `${key} = $${i + 2}`).join(', ');
      const updateValues = [event.bot_id, ...Object.values(updateData)];
      
      await pool.query(
        `UPDATE conversation.block_meetings SET ${updateFields} WHERE recall_bot_id = $1`,
        updateValues
      );
      
      // Send email if meeting is completed and email hasn't been sent yet
      if (event.status === 'completed') {
        const meetingInfo = await pool.query(`
          SELECT 
            bm.block_id,
            bm.transcript_email,
            bm.meeting_url,
            bm.email_sent,
            b.name as meeting_name
          FROM conversation.block_meetings bm
          JOIN conversation.blocks b ON b.block_id = bm.block_id
          WHERE bm.recall_bot_id = $1
        `, [event.bot_id]);
        
        if (meetingInfo.rows.length > 0) {
          const meeting = meetingInfo.rows[0];
          
          if (meeting.transcript_email && !meeting.email_sent) {
            console.log(`Sending transcript email to ${meeting.transcript_email}`);
            await sendTranscriptEmail(
              meeting.block_id,
              meeting.transcript_email,
              meeting.meeting_url,
              meeting.meeting_name
            );
          }
        }
      }
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Error processing webhook');
  }
});

// Webhook endpoint for chat messages (Google Meet, Teams - NOT Zoom)
app.post('/webhook/chat', async (req, res) => {
  console.log('📬 Received chat webhook from Recall.ai');
  
  try {
    const event = req.body;
    console.log('Chat webhook event type:', event.event);
    console.log('Chat webhook event data:', JSON.stringify(event.data, null, 2));
    
    if (event.event === 'participant_events.chat_message') {
      const botId = event.data.bot.id;
      const chatMessage = {
        content: event.data.data.data.text,
        sender: {
          name: event.data.data.participant.name
        },
        timestamp: event.data.data.timestamp.absolute
      };
      
      console.log(`📬 Processing chat message from ${chatMessage.sender.name} for bot ${botId}: "${chatMessage.content}"`);
      
      // Get the real-time transcript for this bot
      const realTimeTranscript = meetingTranscripts.get(botId);
      if (realTimeTranscript) {
        await processChatMessage(botId, chatMessage, realTimeTranscript);
      } else {
        console.log(`⚠️  No active transcript found for bot ${botId}`);
      }
    }
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error processing chat webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Conversational REPL endpoint
app.post('/api/conversational-turn', requireAuth, async (req, res) => {
  try {
    const { content, conversation_id } = req.body;
    const user_id = req.session.user.user_id;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    // Store the user's prompt as a turn
    const userTurnResult = await pool.query(
      'INSERT INTO conversation.turns (participant_id, content, source_type, metadata) VALUES ($1, $2, $3, $4) RETURNING turn_id, created_at',
      [user_id, content, 'conversational-repl-user', { conversation_id }]
    );
    
    const userTurn = userTurnResult.rows[0];
    
    // Generate LLM response
    let llmResponse;
    try {
      if (anthropic) {
        const prompt = `You are powering a Conversational REPL that generates executable UI components.

When responding, output valid ClojureScript data structures that include:
- :response-type (text, list, spreadsheet, diagram, email, etc.)
- :data (the core content)
- :interactions (functions for user interactions)

User prompt: "${content}"

Respond with a ClojureScript data structure. Examples:

For lists:
{:response-type :list
 :items ["Item 1" "Item 2" "Item 3"]
 :interactions {:on-click "handle-click"}}

For spreadsheets:
{:response-type :spreadsheet
 :title "Data Analysis"
 :headers ["Name" "Value" "Status"]
 :data [["Alice" "100" "Active"] ["Bob" "200" "Inactive"]]}

For text:
{:response-type :text
 :content "Your response here"}

Choose the most appropriate response type based on the user's request.`;

        const message = await anthropic.messages.create({
          model: "claude-3-haiku-20240307",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }]
        });
        
        let responseText = message.content[0].text;
        
        // Try to parse as ClojureScript data structure
        try {
          // Simple parsing - look for {:response-type pattern
          if (responseText.includes(':response-type')) {
            llmResponse = responseText.trim();
          } else {
            // Fallback to text response
            llmResponse = `{:response-type :text :content "${responseText.replace(/"/g, '\\"')}"}`;
          }
        } catch (parseError) {
          llmResponse = `{:response-type :text :content "${responseText.replace(/"/g, '\\"')}"}`;
        }
        
      } else {
        llmResponse = `{:response-type :text :content "Claude not available - check ANTHROPIC_API_KEY"}`;
      }
    } catch (llmError) {
      console.error('LLM Error:', llmError);
      llmResponse = `{:response-type :text :content "Error generating response: ${llmError.message}"}`;
    }
    
    // Store the LLM response as a turn
    const llmTurnResult = await pool.query(
      'INSERT INTO conversation.turns (participant_id, content, source_type, metadata) VALUES ($1, $2, $3, $4) RETURNING turn_id, created_at',
      [user_id, llmResponse, 'conversational-repl-llm', { 
        conversation_id, 
        user_turn_id: userTurn.turn_id,
        response_type: 'clojure-data'
      }]
    );
    
    const llmTurn = llmTurnResult.rows[0];
    
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

// Function to check and handle stuck meetings
async function checkStuckMeetings() {
  try {
    // Find meetings that have been in 'joining' status for more than 10 minutes
    const stuckMeetings = await pool.query(`
      SELECT 
        bm.block_id,
        bm.recall_bot_id,
        bm.transcript_email,
        bm.meeting_url,
        bm.email_sent,
        bm.status,
        bm.created_at,
        b.name as meeting_name
      FROM conversation.block_meetings bm
      JOIN conversation.blocks b ON b.block_id = bm.block_id
      WHERE bm.status = 'joining' 
        AND bm.created_at < NOW() - INTERVAL '10 minutes'
        AND bm.email_sent IS NOT TRUE
        AND bm.transcript_email IS NOT NULL
    `);
    
    console.log(`Found ${stuckMeetings.rows.length} stuck meetings to check`);
    
    for (const meeting of stuckMeetings.rows) {
      // Check if we have any transcript data for this meeting
      const turnsCheck = await pool.query(`
        SELECT COUNT(*) as turn_count 
        FROM conversation.block_turns 
        WHERE block_id = $1
      `, [meeting.block_id]);
      
      const turnCount = parseInt(turnsCheck.rows[0].turn_count);
      
      if (turnCount > 0) {
        console.log(`Meeting ${meeting.block_id} stuck in 'joining' but has ${turnCount} turns - forcing transcript send`);
        
        // Try to get bot status from Recall.ai
        try {
          const botResponse = await fetch(`https://us-west-2.recall.ai/api/v1/bot/${meeting.recall_bot_id}/`, {
            headers: {
              'Authorization': `Token ${process.env.RECALL_API_KEY}`
            }
          });
          
          if (botResponse.ok) {
            const botData = await botResponse.json();
            console.log(`Bot ${meeting.recall_bot_id} actual status: ${botData.status}`);
            
            // Update status if different
            if (botData.status !== 'joining') {
              await pool.query(
                'UPDATE conversation.block_meetings SET status = $1 WHERE recall_bot_id = $2',
                [botData.status, meeting.recall_bot_id]
              );
            }
            
            // If bot is done (completed, failed, etc) or has been stuck for too long, send transcript
            if (botData.status === 'completed' || botData.status === 'failed' || 
                (botData.status === 'joining' && new Date(meeting.created_at) < new Date(Date.now() - 30 * 60 * 1000))) {
              await sendTranscriptEmail(
                meeting.block_id,
                meeting.transcript_email,
                meeting.meeting_url,
                meeting.meeting_name
              );
            }
          }
        } catch (error) {
          console.error(`Error checking bot status for ${meeting.recall_bot_id}:`, error);
          
          // If we can't check bot status and meeting is over 30 minutes old with transcript data, send it
          if (new Date(meeting.created_at) < new Date(Date.now() - 30 * 60 * 1000)) {
            console.log(`Forcing transcript send for old stuck meeting ${meeting.block_id}`);
            await sendTranscriptEmail(
              meeting.block_id,
              meeting.transcript_email,
              meeting.meeting_url,
              meeting.meeting_name
            );
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking stuck meetings:', error);
  }
}

// Check for stuck meetings every 5 minutes
setInterval(checkStuckMeetings, 5 * 60 * 1000);

// Also check on startup after a delay
setTimeout(checkStuckMeetings, 30 * 1000);

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Cogito Recall Bot server running on port ${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}`);
});
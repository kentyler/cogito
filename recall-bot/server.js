require('dotenv').config();
const express = require('express');
const { WebSocketServer } = require('ws');
const { Pool } = require('pg');
const fetch = require('node-fetch');
const crypto = require('crypto');
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');

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
  client.query('SET search_path = public, conversation, client_mgmt');
});

// Test database connection on startup
pool.connect()
  .then(client => {
    console.log('✅ PostgreSQL connected successfully');
    client.release();
  })
  .catch(err => {
    console.error('❌ PostgreSQL connection failed:', err.message);
  });

// Middleware
app.use(express.json());

// Temporary migration endpoint (remove after migration)
const { addMigrationEndpoint } = require('./migrate-endpoint');
addMigrationEndpoint(app);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'cogito-recall-bot', version: '1.1' });
});

// Serve bot creator UI at /create-bot subfolder
app.use('/create-bot', express.static('public'));

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

class RealTimeTranscript {
  constructor(botId) {
    this.botId = botId;
    this.fullTranscript = '';
    this.messageHistory = [];
    this.participantContributions = new Map();
    this.startTime = Date.now();
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
    
    // Check for questions to Cogito
    this.checkForQuestions(message);
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
      
      // TODO: Add Claude API call here
      const response = await this.queryClaudeWithContext(speaker, questionText, context);
      
      // Send response to Zoom chat via Recall.ai
      await this.sendChatResponse(response);
      
    } catch (error) {
      console.error('Error handling Claude question:', error);
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

Please respond helpfully as a meeting participant. Keep your response concise (under 150 words) since it will be sent to the meeting chat. Be conversational and reference the meeting context when relevant.`;

      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 200,
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
      
      // Check if we should process the buffer (every ~100 words)
      const wordCount = buffer.text.trim().split(/\s+/).length;
      const shouldProcess = wordCount >= 100;
      
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
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Helper function to generate embedding for text
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

// API endpoint to create a meeting bot
app.post('/api/create-bot', async (req, res) => {
  try {
    const { meeting_url, client_id, meeting_name } = req.body;
    
    if (!meeting_url) {
      return res.status(400).json({ error: 'meeting_url is required' });
    }
    
    console.log('Creating bot for meeting:', meeting_url);
    
    // Get the external URL for WebSocket connection
    let websocketUrl;
    if (process.env.RENDER_EXTERNAL_URL) {
      // Remove protocol if present
      const cleanUrl = process.env.RENDER_EXTERNAL_URL.replace(/^https?:\/\//, '');
      websocketUrl = `wss://${cleanUrl}/transcript`;
    } else {
      websocketUrl = `ws://localhost:${process.env.PORT || 8080}/transcript`;
    }
    
    console.log('WebSocket URL for real-time transcription:', websocketUrl);
    
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
            }
          ]
        },
        webhook_url: `https://${process.env.RENDER_EXTERNAL_URL}/webhook`
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
    
    // Create a block for this meeting
    const blockResult = await pool.query(
      `INSERT INTO blocks (name, description, block_type, metadata) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [
        meeting_name || `Meeting ${new Date().toISOString()}`,
        `Meeting from ${meeting_url}`,
        'meeting',
        { created_by: 'recall_bot', recall_bot_id: botData.id }
      ]
    );
    const block = blockResult.rows[0];
    console.log('Block created:', block.block_id);
    
    // Create meeting-specific data
    // Handle client_id - if it's not a number, default to 8 for public users
    const numericClientId = client_id && !isNaN(client_id) ? parseInt(client_id) : 8;
    // Default invited_by_user_id to 1 (must exist in database)
    const invitedByUserId = 1;
    
    const meetingResult = await pool.query(
      `INSERT INTO block_meetings (block_id, recall_bot_id, meeting_url, client_id, invited_by_user_id, status) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [block.block_id, botData.id, meeting_url, numericClientId, invitedByUserId, 'joining']
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
        `UPDATE block_meetings SET ${updateFields} WHERE recall_bot_id = $1`,
        updateValues
      );
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Error processing webhook');
  }
});

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Cogito Recall Bot server running on port ${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}`);
});
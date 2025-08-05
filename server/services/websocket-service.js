import { WebSocketServer } from 'ws';

// WebSocket service for handling real-time transcription from Recall.ai
export class WebSocketService {
  constructor(server, dependencies) {
    this.server = server;
    this.pool = dependencies.pool;
    this.appendToConversation = dependencies.appendToConversation;
    this.processTranscriptChunk = dependencies.processTranscriptChunk;
    this.completeMeetingByInactivity = dependencies.completeMeetingByInactivity;
    this.meetingLastActivity = dependencies.meetingLastActivity;
    
    // Create WebSocket server
    this.wss = new WebSocketServer({ server, path: '/transcript' });
    this.setupWebSocketHandlers();
  }

  setupWebSocketHandlers() {
    this.wss.on('connection', (ws, req) => {
      console.log('🔗 Recall.ai bot connected for real-time transcription');
      let currentBotId = null;
      
      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          console.log('📝 Received message:', { event: message.event, type: message.data?.type || 'transcript' });
          
          await this.handleTranscriptMessage(message, currentBotId, (botId) => {
            currentBotId = botId;
          });
          
        } catch (error) {
          console.error('❌ Error processing transcript:', error);
        }
      });
      
      ws.on('close', async () => {
        console.log('🔌 Recall.ai bot disconnected');
        await this.handleWebSocketClose(currentBotId);
      });
      
      ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
      });
    });
  }

  async handleTranscriptMessage(message, currentBotId, setBotId) {
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
      setBotId(botId);
      console.log(`🆔 Bot ID set: ${botId}`);
    }
    
    // Update last activity timestamp for inactivity detection
    this.meetingLastActivity.set(botId, Date.now());
    
    // Get meeting info
    const meetingResult = await this.pool.query(`
      SELECT * 
      FROM meetings
      WHERE recall_bot_id = $1 AND meeting_type != 'system'
    `, [botId]);
    
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
      await this.processTranscriptText(meeting, speakerName, text);
    }
  }

  async processTranscriptText(meeting, speakerName, text) {
    // Append directly to conversation timeline (legacy approach)
    const conversationEntry = `[${speakerName}] ${text}\n`;
    const success = await this.appendToConversation(meeting.id, conversationEntry);
    
    if (success) {
      console.log(`📝 Appended transcript from ${speakerName}: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);
    } else {
      console.error(`❌ Failed to append transcript from ${speakerName}`);
    }
    
    // NEW: Process through transcript buffer agent
    try {
      await this.processTranscriptChunk(meeting, speakerName, text);
    } catch (error) {
      console.error('❌ Error processing transcript chunk through agents:', error);
    }
  }

  async handleWebSocketClose(currentBotId) {
    // If we have a current bot ID, try to complete the meeting
    if (currentBotId) {
      console.log(`🏁 WebSocket closed for bot ${currentBotId}, completing meeting`);
      
      // Give a short delay in case it's just a temporary disconnect
      setTimeout(async () => {
        try {
          await this.completeMeetingByInactivity(currentBotId, 'websocket_disconnect');
        } catch (error) {
          console.error(`❌ Error completing meeting on disconnect:`, error);
        }
      }, 30000); // 30 second delay
    }
  }
}
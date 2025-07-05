#!/usr/bin/env node

/**
 * Cogito Live Meeting Server
 * WebSocket server for real-time meeting intelligence
 */

import express from 'express';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import { MeetingRoleAnalyzer } from './lib/meeting-role-analyzer.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(join(__dirname, 'public')));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'cogito-live',
    version: '0.1.0'
  });
});

// Start HTTP server
const server = app.listen(PORT, () => {
  console.log(`🚀 Cogito Live Meeting Server`);
  console.log(`📡 HTTP: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
  console.log(`\n💡 Open http://localhost:${PORT} in your browser\n`);
});

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Track active connections
const connections = new Map();

wss.on('connection', (ws, req) => {
  const connectionId = Date.now().toString();
  
  console.log(`🔗 New connection: ${connectionId}`);
  
  // Store connection with role analyzer
  connections.set(connectionId, {
    ws,
    meetingId: null,
    participantName: null,
    roleAnalyzer: new MeetingRoleAnalyzer()
  });
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    connectionId,
    message: 'Connected to Cogito Live Meeting Server'
  }));
  
  // Handle incoming messages
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      console.log(`📨 Received: ${message.type} from ${connectionId}`);
      
      switch (message.type) {
        case 'start-meeting':
          handleStartMeeting(connectionId, message);
          break;
          
        case 'audio-chunk':
          handleAudioChunk(connectionId, message);
          break;
          
        case 'end-meeting':
          handleEndMeeting(connectionId);
          break;
          
        default:
          console.log(`❓ Unknown message type: ${message.type}`);
      }
      
    } catch (error) {
      console.error(`❌ Error processing message:`, error);
      ws.send(JSON.stringify({
        type: 'error',
        message: error.message
      }));
    }
  });
  
  // Handle disconnect
  ws.on('close', () => {
    console.log(`🔌 Disconnected: ${connectionId}`);
    connections.delete(connectionId);
  });
  
  ws.on('error', (error) => {
    console.error(`❌ WebSocket error for ${connectionId}:`, error);
  });
});

// Message handlers
function handleStartMeeting(connectionId, message) {
  const connection = connections.get(connectionId);
  
  connection.meetingId = `meeting-${Date.now()}`;
  connection.participantName = message.participantName || 'Anonymous';
  
  console.log(`🎯 Meeting started: ${connection.meetingId}`);
  console.log(`👤 Participant: ${connection.participantName}`);
  
  connection.ws.send(JSON.stringify({
    type: 'meeting-started',
    meetingId: connection.meetingId,
    timestamp: new Date().toISOString()
  }));
}

function handleAudioChunk(connectionId, message) {
  const connection = connections.get(connectionId);
  
  if (!connection.meetingId) {
    connection.ws.send(JSON.stringify({
      type: 'error',
      message: 'No active meeting'
    }));
    return;
  }
  
  // TODO: Process audio chunk
  // For now, just acknowledge receipt
  console.log(`🎤 Audio chunk received: ${message.data.length} bytes`);
  
  // Simulate transcription response with role analysis
  setTimeout(() => {
    const simulatedText = 'What if we approach this differently and consider the budget from a strategic perspective?';
    
    // Analyze for meeting roles
    const detectedRoles = connection.roleAnalyzer.analyzeTranscriptForRoles(
      simulatedText, 
      connection.participantName || 'Speaker'
    );
    
    // Send transcription
    connection.ws.send(JSON.stringify({
      type: 'transcription',
      text: simulatedText,
      timestamp: new Date().toISOString(),
      roles: detectedRoles
    }));
    
    // Generate and send role-based insights
    const insight = connection.roleAnalyzer.getFormattedInsight();
    if (insight) {
      setTimeout(() => {
        connection.ws.send(JSON.stringify({
          type: 'insight',
          insightType: 'meeting_roles',
          text: insight,
          timestamp: new Date().toISOString()
        }));
      }, 500);
    }
  }, 100);
}

function handleEndMeeting(connectionId) {
  const connection = connections.get(connectionId);
  
  if (connection.meetingId) {
    console.log(`🏁 Meeting ended: ${connection.meetingId}`);
    
    connection.ws.send(JSON.stringify({
      type: 'meeting-ended',
      meetingId: connection.meetingId,
      timestamp: new Date().toISOString()
    }));
    
    connection.meetingId = null;
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n📴 Shutting down server...');
  
  // Close all connections
  connections.forEach((conn, id) => {
    conn.ws.close();
  });
  
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
#!/usr/bin/env node

import express from 'express';
import http from 'http';

// Import configuration
import { initializeDatabase } from './server/config/database.js';
import { initializeEmail } from './server/config/email.js';
import { configureMiddleware } from './server/config/middleware.js';

// Import services
import { MeetingService } from './server/services/meeting-service.js';
import { WebSocketService } from './server/services/websocket-service.js';

// Import routes
import authRoutes from './server/routes/auth.js';
import authExtendedRoutes from './server/routes/auth-extended.js';
import conversationRoutes from './server/routes/conversations.js';
import searchRoutes from './server/routes/search.js';
import meetingsCrudRoutes from './server/routes/meetings-crud.js';
import meetingsEmbeddingsRoutes from './server/routes/meetings-embeddings.js';
import meetingsAdditionalRoutes from './server/routes/meetings-additional.js';
import browserCaptureRoutes from './server/routes/browser-capture.js';
import botsCreateRoutes from './server/routes/bots-create.js';
import botsManagementRoutes from './server/routes/bots-management.js';
import webhookChatRoutes from './server/routes/webhook-chat.js';

// Import core services
import { createTurnProcessor } from './lib/turn-processor.js';
import { FileUploadService } from './lib/file-upload-service.js';
import Database from './lib/database.js';

const app = express();

// Global state
let turnProcessor = null;
let meetingService = null;

// Transcript processing agents
let TranscriptBufferAgent, TurnEmbeddingAgent, SpeakerProfileAgent;
let embeddingAgent = null;

// Track active meetings and processing state
const meetingBuffers = new Map();
const meetingSpeakerAgents = new Map();
const meetingLastActivity = new Map();

// Initialize and start server
async function startServer() {
  try {
    // Initialize database and core services
    const pool = await initializeDatabase();
    const db = new Database(pool);
    const { anthropic, getEmailTransporter } = await initializeEmail();
    const fileUploadService = new FileUploadService(pool);
    
    // Configure middleware and inject dependencies
    app.use(configureMiddleware());
    app.use((req, res, next) => {
      req.db = db;
      req.pool = pool;
      req.anthropic = anthropic;
      req.fileUploadService = fileUploadService;
      req.appendToConversation = (...args) => meetingService.appendToConversation(...args);
      next();
    });
    
    // Initialize processing services
    turnProcessor = await createTurnProcessor(pool, {
      generateEmbeddings: true
    });
    console.log('✅ Turn processor initialized with embedding support');
    
    // Import and initialize transcript processing agents
    const { TranscriptBufferAgent: TBA } = await import('./lib/transcript-buffer-agent.js');
    const { TurnEmbeddingAgent: TEA } = await import('./lib/turn-embedding-agent.js');
    const { SpeakerProfileAgent: SPA } = await import('./lib/speaker-profile-agent.js');
    
    TranscriptBufferAgent = TBA;
    TurnEmbeddingAgent = TEA;
    SpeakerProfileAgent = SPA;
    embeddingAgent = new TurnEmbeddingAgent();
    console.log('✅ Transcript processing agents initialized');
    
    // Initialize meeting service
    meetingService = new MeetingService({
      pool,
      getEmailTransporter,
      meetingBuffers,
      meetingSpeakerAgents,
      meetingLastActivity
    });
    meetingService.setAgentClasses(TranscriptBufferAgent, TurnEmbeddingAgent, SpeakerProfileAgent, embeddingAgent);
    
    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ status: 'healthy', service: 'conversational-repl' });
    });
    
    // Mount route handlers
    app.use(authRoutes);
    app.use(authExtendedRoutes);
    app.use(conversationRoutes);
    app.use(searchRoutes);
    app.use(meetingsCrudRoutes);
    app.use(meetingsEmbeddingsRoutes);
    app.use(meetingsAdditionalRoutes);
    app.use(browserCaptureRoutes);
    app.use(botsCreateRoutes);
    app.use(botsManagementRoutes);
    app.use(webhookChatRoutes);
    
    // Create HTTP server
    const server = http.createServer(app);
    
    // Initialize WebSocket service for real-time transcription
    new WebSocketService(server, {
      pool,
      appendToConversation: (...args) => meetingService.appendToConversation(...args),
      processTranscriptChunk: (...args) => meetingService.processTranscriptChunk(...args),
      completeMeetingByInactivity: (...args) => meetingService.completeMeetingByInactivity(...args),
      meetingLastActivity
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
      setInterval(() => meetingService.cleanupInactiveMeetings(), 5 * 60 * 1000);
      console.log(`🧹 Meeting cleanup scheduled every 5 minutes`);
      
      // Run initial cleanup after 1 minute
      setTimeout(() => meetingService.cleanupInactiveMeetings(), 60 * 1000);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
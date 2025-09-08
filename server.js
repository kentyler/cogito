#!/usr/bin/env node

import 'dotenv/config';
import express from 'express';
import http from 'http';

// Global error handlers to catch crashes
process.on('uncaughtException', (error) => {
  console.error('🚨 UNCAUGHT EXCEPTION - Server will exit:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 UNHANDLED PROMISE REJECTION:', reason);
  console.error('Promise:', promise);
  console.error('Stack trace:', reason?.stack || 'No stack trace available');
});

// Import configuration
import { initializeDatabase, databaseMiddleware } from './server/config/database.js';
import { initializeEmail } from './server/config/email.js';
import { initializeLLMProviders } from './server/config/llm-providers.js';

// Import services
import { MeetingService } from './server/services/meeting-service.js';
import { WebSocketService } from './server/services/websocket-service.js';

// Import server initializer
import { createExpressApp, setupAppMiddleware, mountRoutes } from './server/startup/server-initializer.js';

// Import core services
import { createTurnProcessor } from '#ai-agents/turn-processor.js';
import { FileUploadService } from '#uploads/file-upload.js';
import { EventLogger } from '#server/events/event-logger.js';

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
    
    // Create Express app using server-initializer
    const app = createExpressApp();
    const { getEmailTransporter } = await initializeEmail();
    const llmProviders = await initializeLLMProviders(pool);
    const fileUploadService = new FileUploadService(pool);
    const eventLogger = new EventLogger(pool);
    
    // Initialize processing services
    turnProcessor = await createTurnProcessor(pool, {
      generateEmbeddings: true
    });
    console.log('✅ Turn processor initialized with embedding support');
    
    // Setup middleware and database connections
    setupAppMiddleware(app, pool);
    app.use(databaseMiddleware);
    app.use((req, res, next) => {
      req.pool = pool;
      // Add all LLM providers to the request object
      req.anthropic = llmProviders.anthropic;
      req.openai = llmProviders.openai;
      req.google = llmProviders.google;
      req.mistral = llmProviders.mistral;
      req.fileUploadService = fileUploadService;
      req.turnProcessor = turnProcessor;
      req.logger = eventLogger;
      req.appendToConversation = (...args) => meetingService.appendToConversation(...args);
      next();
    });
    
    // Import and initialize transcript processing agents
    const { TranscriptBufferAgent: TBA } = await import('#ai-agents/transcript-buffer-agent.js');
    const { TurnEmbeddingAgent: TEA } = await import('#ai-agents/turn-embedding-agent.js');
    const { SpeakerProfileAgent: SPA } = await import('#ai-agents/speaker-profile-agent.js');
    
    TranscriptBufferAgent = TBA;
    TurnEmbeddingAgent = TEA;
    SpeakerProfileAgent = SPA;
    embeddingAgent = new TurnEmbeddingAgent({ pool });
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
    
    // Mount all routes using server initializer
    mountRoutes(app);
    
    // Create HTTP server
    // Available methods: createServer - verified Node.js http module method
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
/**
 * Server Initializer - Handles Express app setup and route mounting
 */

import express from 'express';
import { setupMiddleware } from '../config/middleware.js';

// Import routes (organized by domain)
// Auth routes
import authRoutes from '../routes/auth/index.js';
import authSessionRoutes from '../routes/auth/session-management.js';
import authOAuthRoutes from '../routes/auth/oauth.js';

// Client management routes
import clientManagementRoutes from '../routes/client-management/index.js';

// Meeting routes
import meetingsCrudRoutes from '../routes/meetings/crud.js';
import meetingsAdditionalRoutes from '../routes/meetings/additional.js';

// Settings routes
import settingsRoutes from '../routes/settings/index.js';

// Other routes
import chatInterfaceRoutes from '../routes/chat-interface.js';
import adminClientManagementRoutes from '../routes/admin-client-management.js';
import conversationRoutes from '../routes/conversations.js';
import searchRoutes from '../routes/search.js';
import invitationGatewayRoutes from '../routes/invitation-gateway.js';
import invitationRoutes from '../routes/invitations.js';
import extensionApiRoutes from '../routes/extension-api.js';
import botsManagementRoutes from '../routes/bots-management.js';
import botsCreateRoutes from '../routes/bots-create.js';
import browserCaptureRoutes from '../routes/browser-capture.js';
import webhookChatRoutes from '../routes/webhook-chat.js';
import uploadFilesRoutes from '../routes/upload-files.js';
import summaryHandlersRoutes from '../routes/summary-routes.js';

export function createExpressApp() {
  const app = express();
  return app;
}

export function setupAppMiddleware(app, pool) {
  // Setup middleware with pool for session store
  setupMiddleware(app, pool);
}

export function mountRoutes(app) {
  // Mount routes with appropriate prefixes
  
  // Auth routes
  app.use('/api', authRoutes);
  app.use('/api', authSessionRoutes);
  app.use('/auth/oauth', authOAuthRoutes);
  
  // Client management
  app.use('/api', clientManagementRoutes);
  
  // Meetings
  app.use('/api', meetingsCrudRoutes);
  app.use('/api', meetingsAdditionalRoutes);
  
  // Settings
  app.use('/settings', settingsRoutes);
  
  // Core functionality
  app.use('/', chatInterfaceRoutes);
  app.use('/api', conversationRoutes);
  app.use('/', searchRoutes);
  
  // Admin routes
  app.use('/api/admin', adminClientManagementRoutes);
  
  // Integrations
  app.use('/api', extensionApiRoutes);
  app.use('/webhook', webhookChatRoutes);
  app.use('/browser-capture', browserCaptureRoutes);
  
  // Bot management
  app.use('/api', botsManagementRoutes);
  app.use('/api', botsCreateRoutes);
  
  // File operations
  app.use('/api/upload-files', uploadFilesRoutes);
  
  // Summary and reporting
  app.use('/api', summaryHandlersRoutes);
  
  // Invitation system
  app.use('/api/invitations', invitationRoutes);
  app.use('/', invitationGatewayRoutes);
}
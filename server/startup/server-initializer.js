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
import meetingSummariesRoutes from '../routes/meeting-summaries.js';
import adminUserManagementRoutes from '../routes/admin-user-management.js';

export function createExpressApp() {
  const app = express();
  
  // Setup middleware
  setupMiddleware(app);
  
  return app;
}

export function mountRoutes(app) {
  // Mount routes with appropriate prefixes
  
  // Auth routes
  app.use('/', authRoutes);
  app.use('/auth', authSessionRoutes);
  app.use('/auth', authOAuthRoutes);
  
  // Client management
  app.use('/client-management', clientManagementRoutes);
  
  // Meetings
  app.use('/meetings', meetingsCrudRoutes);
  app.use('/meetings', meetingsAdditionalRoutes);
  
  // Settings
  app.use('/settings', settingsRoutes);
  
  // Core functionality
  app.use('/', chatInterfaceRoutes);
  app.use('/conversations', conversationRoutes);
  app.use('/search', searchRoutes);
  
  // Admin routes
  app.use('/api/admin', adminClientManagementRoutes);
  app.use('/api/admin', adminUserManagementRoutes);
  
  // Integrations
  app.use('/api', extensionApiRoutes);
  app.use('/webhook', webhookChatRoutes);
  app.use('/browser-capture', browserCaptureRoutes);
  
  // Bot management
  app.use('/bots', botsManagementRoutes);
  app.use('/bots', botsCreateRoutes);
  
  // File operations
  app.use('/upload', uploadFilesRoutes);
  
  // Summary and reporting
  app.use('/summaries', summaryHandlersRoutes);
  app.use('/meeting-summaries', meetingSummariesRoutes);
  
  // Invitation system
  app.use('/invitations', invitationRoutes);
  app.use('/invite', invitationGatewayRoutes);
}
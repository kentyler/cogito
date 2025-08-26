/**
 * Database Agent - Modular version with specialized components
 * 
 * Intelligent database operations handler that coordinates specialized modules:
 * - DatabaseConnector: Connection and basic query operations
 * - SchemaInspector: Schema inspection and caching
 * - TranscriptProcessor: Transcript import and analysis
 * - SearchAnalyzer: Search and analytics operations
 */

import { DatabaseConnector } from './database-agent/core/database-connector.js';
import { SchemaInspector } from './database-agent/core/schema-inspector.js';
import { EnforcedQueryBuilder } from './database-agent/utils/enforced-query-builder.js';
import { TranscriptProcessor } from './database-agent/specialized/transcript-processor.js';
import { SearchAnalyzer } from './database-agent/specialized/search-analyzer.js';
import { UserOperations } from './database-agent/domains/user-operations.js';
import { MeetingOperations } from './database-agent/domains/meeting-operations.js';
import { FileOperations } from './database-agent/domains/file-operations.js';
import { TurnOperations } from './database-agent/domains/turn-operations.js';
import { LocationOperations } from './database-agent/domains/location-operations.js';
import { BotOperations } from './database-agent/domains/bot-operations.js';
import { ClientOperations } from './database-agent/domains/client-operations.js';
import { ClientSettingsOperations } from './database-agent/domains/client-settings-operations.js';
import DesignGamesOperations from './database-agent/domains/design-games-operations.js';
import { SummaryOperations } from './database-agent/domains/summary-operations.js';
import { LLMOperations } from './database-agent/domains/llm-operations.js';

export class DatabaseAgent {
  constructor() {
    // Initialize core
    this.connector = new DatabaseConnector();
    this.schemaInspector = new SchemaInspector(this.connector);
    this.queryBuilder = new EnforcedQueryBuilder(this.schemaInspector);
    
    // Initialize domain modules (order matters for dependencies)
    this.users = new UserOperations(this.connector);
    this.turns = new TurnOperations(this.connector);
    this.files = new FileOperations(this.connector);
    this.locations = new LocationOperations(this.connector);
    this.bots = new BotOperations(this.connector);
    this.clients = new ClientOperations(this.connector);
    this.clientSettings = new ClientSettingsOperations(this.connector);
    this.designGames = new DesignGamesOperations(this.connector);
    this.summaries = new SummaryOperations(this.connector);
    this.llms = new LLMOperations(this.connector);
    
    // Initialize meetings last so it can reference turns
    this.meetings = new MeetingOperations(this.connector);
    this.meetings.setTurnsOperations(this.turns);
    
    // Initialize specialized modules
    this.transcriptProcessor = new TranscriptProcessor(this.connector);
    this.searchAnalyzer = new SearchAnalyzer(this.connector);
  }

  // Delegate connection operations
  async connect() {
    return await this.connector.connect();
  }

  async query(sql, params = []) {
    return await this.connector.query(sql, params);
  }

  async transaction(callback) {
    return await this.connector.transaction(callback);
  }

  async close() {
    return await this.connector.close();
  }

  // Delegate schema operations
  async getSchema(forceRefresh = false) {
    return await this.schemaInspector.getSchema(forceRefresh);
  }

  async findTable(tableName) {
    return await this.schemaInspector.findTable(tableName);
  }

  // Delegate transcript operations
  async getMeetingTranscripts(options = {}) {
    return await this.transcriptProcessor.getMeetingTranscripts(options);
  }

  async importTranscript(options) {
    return await this.transcriptProcessor.importTranscript(options);
  }

  parseBasicTranscript(content) {
    return this.transcriptProcessor.parseBasicTranscript(content);
  }

  async analyzeTranscript(meetingId) {
    return await this.transcriptProcessor.analyzeTranscript(meetingId);
  }

  // Delegate search operations
  async searchTranscripts(searchTerm, options = {}) {
    return await this.searchAnalyzer.searchTranscripts(searchTerm, options);
  }

  async getUserStats(userId) {
    return await this.searchAnalyzer.getUserStats(userId);
  }

  // Meeting-related operations
  async getMeetingByBotId(botId, excludeStatuses = ['completed', 'inactive']) {
    const query = `
      SELECT * FROM meetings.meetings 
      WHERE recall_bot_id = $1 
      AND status NOT IN (${excludeStatuses.map((_, i) => `$${i + 2}`).join(', ')})
    `;
    const params = [botId, ...excludeStatuses];
    const result = await this.connector.query(query, params);
    return result.rows[0] || null;
  }

  // Get event logger for error tracking
  getEventLogger() {
    return this.connector.getEventLogger();
  }

  // Centralized event logging methods
  async logEvent(eventName, eventData, context = {}) {
    const eventLogger = this.getEventLogger();
    if (eventLogger) {
      return await eventLogger.logEvent(eventName, eventData, context);
    }
    return null;
  }

  async logError(eventName, error, context = {}) {
    const eventLogger = this.getEventLogger();
    if (eventLogger) {
      return await eventLogger.logError(eventName, error, context);
    }
    return null;
  }

  // Application-specific event helpers
  async logAuthEvent(eventType, userData, context = {}) {
    return await this.logEvent(eventType, {
      user_id: userData.user_id || userData.id,
      email: userData.email,
      client_id: userData.client_id,
      client_name: userData.client_name,
      timestamp: new Date().toISOString()
    }, {
      ...context,
      severity: context.severity || 'info',
      component: context.component || 'Authentication'
    });
  }

  async logClientEvent(eventType, clientData, context = {}) {
    return await this.logEvent(eventType, {
      client_id: clientData.client_id || clientData.id,
      client_name: clientData.client_name || clientData.name,
      timestamp: new Date().toISOString()
    }, {
      ...context,
      severity: context.severity || 'info',
      component: context.component || 'ClientManagement'
    });
  }

  async logDatabaseEvent(eventType, operationData, context = {}) {
    return await this.logEvent(eventType, {
      ...operationData,
      timestamp: new Date().toISOString()
    }, {
      ...context,
      severity: context.severity || 'info',
      component: context.component || 'DatabaseOperations'
    });
  }

  // Convenience method to get access to specialized modules
  get modules() {
    return {
      connector: this.connector,
      schema: this.schemaInspector,
      transcript: this.transcriptProcessor,
      search: this.searchAnalyzer
    };
  }
}

// Export singleton instance for backward compatibility
export const dbAgent = new DatabaseAgent();
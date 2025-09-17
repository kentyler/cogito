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
import { InvitationOperations } from './database-agent/domains/invitation-operations.js';

// Import utility methods
import { debugMeeting, inspectMeeting } from './database-agent/utils/debug-methods.js';
import { logEvent, logError, logAuthEvent, logClientEvent, logDatabaseEvent } from './database-agent/utils/logging-methods.js';

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
    this.invitations = new InvitationOperations(this.connector);
    
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

  async searchFiles(searchTerm, options = {}) {
    return await this.searchAnalyzer.searchFiles(searchTerm, options);
  }

  async searchContext(searchTerm, clientId, options = {}) {
    return await this.searchAnalyzer.searchContext(searchTerm, clientId, options);
  }

  // User statistics
  // Database columns verified: meeting_id, user_id exist in meetings.turns table
  async getUserStats(userId) {
    const stats = await this.query(`
      SELECT 
        COUNT(*) as total_turns,
        COUNT(DISTINCT meeting_id) as total_meetings,
        MIN(created_at) as first_turn,
        MAX(created_at) as last_turn,
        AVG(LENGTH(content::text)) as avg_turn_length
      FROM meetings.turns 
      WHERE user_id = $1
    `, [userId]);

    return stats.rows[0] || {
      total_turns: 0,
      total_meetings: 0,
      first_turn: null,
      last_turn: null,
      avg_turn_length: 0
    };
  }

  // Debug/inspection methods using imported utilities
  async debugMeeting(meetingId) {
    return await debugMeeting(this, meetingId);
  }
  
  async inspectMeeting(meetingId) {
    return await inspectMeeting(this, meetingId);
  }

  // Logging methods using imported utilities
  async logEvent(eventType, eventData, context = {}) {
    return await logEvent(this, eventType, eventData, context);
  }

  async logError(errorType, error, context = {}) {
    return await logError(this, errorType, error, context);
  }

  async logAuthEvent(eventType, userData, context = {}) {
    return await logAuthEvent(this, eventType, userData, context);
  }

  async logClientEvent(eventType, clientData, context = {}) {
    return await logClientEvent(this, eventType, clientData, context);
  }

  async logDatabaseEvent(eventType, operationData, context = {}) {
    return await logDatabaseEvent(this, eventType, operationData, context);
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
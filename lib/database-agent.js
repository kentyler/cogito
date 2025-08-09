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
import { TranscriptProcessor } from './database-agent/specialized/transcript-processor.js';
import { SearchAnalyzer } from './database-agent/specialized/search-analyzer.js';
import { UserOperations } from './database-agent/domains/user-operations.js';
import { MeetingOperations } from './database-agent/domains/meeting-operations.js';
import { FileOperations } from './database-agent/domains/file-operations.js';
import { TurnOperations } from './database-agent/domains/turn-operations.js';
import { LocationOperations } from './database-agent/domains/location-operations.js';
import { BotOperations } from './database-agent/domains/bot-operations.js';

export class DatabaseAgent {
  constructor() {
    // Initialize core
    this.connector = new DatabaseConnector();
    this.schemaInspector = new SchemaInspector(this.connector);
    
    // Initialize domain modules
    this.users = new UserOperations(this.connector);
    this.meetings = new MeetingOperations(this.connector);
    this.files = new FileOperations(this.connector);
    this.turns = new TurnOperations(this.connector);
    this.locations = new LocationOperations(this.connector);
    this.bots = new BotOperations(this.connector);
    
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
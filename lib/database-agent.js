/**
 * Database Agent - Modular version with specialized components
 * 
 * Intelligent database operations handler that coordinates specialized modules:
 * - DatabaseConnector: Connection and basic query operations
 * - SchemaInspector: Schema inspection and caching
 * - TranscriptProcessor: Transcript import and analysis
 * - SearchAnalyzer: Search and analytics operations
 */

import { DatabaseConnector } from './database-agent/database-connector.js';
import { SchemaInspector } from './database-agent/schema-inspector.js';
import { TranscriptProcessor } from './database-agent/transcript-processor.js';
import { SearchAnalyzer } from './database-agent/search-analyzer.js';

export class DatabaseAgent {
  constructor() {
    // Initialize specialized modules
    this.connector = new DatabaseConnector();
    this.schemaInspector = new SchemaInspector(this.connector);
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
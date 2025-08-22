/**
 * Client Detection Service - Modular version with specialized components
 * 
 * Shared service for detecting clients/groups from text across different contexts
 * (meetings, emails, slack, manual sessions)
 */

import { ClientNameExtractor } from './client-detector/client-name-extractor.js';
import { ClientSearcher } from './client-detector/client-searcher.js';
import { ResultFormatter } from './client-detector/result-formatter.js';
import { ClientCreator } from './client-detector/client-creator.js';

export class ClientDetector {
  constructor(databaseManager) {
    this.db = databaseManager;
    this.debug = false;

    // Initialize specialized modules
    this.extractor = new ClientNameExtractor(this.debug);
    this.searcher = new ClientSearcher(this.db);
    this.formatter = new ResultFormatter();
    this.creator = new ClientCreator(this.db);
  }

  /**
   * Main client detection method
   * @param {string} text - Text to analyze for client mentions
   * @param {string} context - Context type: 'meeting', 'email', 'slack', 'manual'
   * @param {object} options - Additional options
   * @returns {object} Detection result with status and client info
   */
  async detectClient(text, context = 'general', options = {}) {
    if (this.debug) console.log(`🔍 Detecting client in: "${text}" (context: ${context})`);
    
    try {
      // Extract potential client names from text
      const candidates = this.extractor.extractClientNames(text, context);
      
      if (candidates.length === 0) {
        return {
          status: 'no_candidates',
          message: 'No potential client names found in text',
          searched_text: text
        };
      }

      // Search for clients in database
      const searchResults = await this.searcher.searchClients(candidates);
      
      // Analyze results and determine response
      return this.formatter.formatDetectionResult(searchResults, candidates, text);
      
    } catch (error) {
      console.error('Client detection error:', error);
      return {
        status: 'error',
        message: 'Error during client detection',
        error: error.message
      };
    }
  }

  /**
   * Create a new client based on user confirmation
   * @param {string} name - Client name
   * @param {string} description - Optional description
   * @param {Object} metadata - Additional metadata
   * @returns {Object} - Creation result
   */
  async createNewClient(name, description = '', metadata = {}) {
    return await this.creator.createNewClient(name, description, metadata);
  }

  /**
   * Enable debug logging
   */
  enableDebug() {
    this.debug = true;
    this.extractor = new ClientNameExtractor(this.debug);
  }

  /**
   * Test the detector with sample inputs
   */
  async test() {
    const testCases = [
      { text: 'This is a meeting of the conflict club', context: 'meeting' },
      { text: 'Re: Conflict Resolution Club discussion', context: 'email' },
      { text: 'Starting session with the team', context: 'manual' },
      { text: 'Project Alpha meeting notes', context: 'general' }
    ];

    console.log('🧪 Testing Client Detector:');
    for (const testCase of testCases) {
      console.log(`\nTest: "${testCase.text}" (${testCase.context})`);
      const result = await this.detectClient(testCase.text, testCase.context);
      console.log(`Result: ${result.status} - ${result.message}`);
    }
  }

  /**
   * Convenience method to get access to specialized modules
   */
  get modules() {
    return {
      extractor: this.extractor,
      searcher: this.searcher,
      formatter: this.formatter,
      creator: this.creator
    };
  }
}
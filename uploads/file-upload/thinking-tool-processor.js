/**
 * Thinking Tool Processor
 * Handles .cogito files containing structured thinking tool data
 */

import { DatabaseAgent } from '#database/database-agent.js';
import { ThinkingToolValidator } from './thinking-tool-validator.js';
import { ThinkingToolStorage } from './thinking-tool-storage.js';
import { ThinkingToolAnalyzer } from './thinking-tool-analyzer.js';

export class ThinkingToolProcessor {
  constructor() {
    this.dbAgent = new DatabaseAgent();
    this.storage = new ThinkingToolStorage(this.dbAgent);
  }

  /**
   * Process a .cogito file
   * @param {Buffer} fileBuffer - The file content
   * @param {Object} metadata - File metadata (name, size, etc.)
   * @param {string} clientId - Client ID for multi-tenant support
   * @param {string} userId - User ID for tracking
   * @param {string} meetingId - Meeting ID for context
   * @returns {Object} Processing result with analysis
   */
  async process(fileBuffer, metadata, clientId, userId, meetingId) {
    try {
      // Parse the .cogito file
      const fileContent = fileBuffer.toString('utf-8');
      const toolData = JSON.parse(fileContent);
      
      // Validate structure
      await ThinkingToolValidator.validateStructure(toolData);
      
      // Store the submission
      const submissionId = await this.storage.storeSubmission(
        toolData, 
        metadata, 
        clientId, 
        userId, 
        meetingId
      );
      
      // Generate analysis
      const analysis = await ThinkingToolAnalyzer.generateAnalysis(toolData);
      
      // Store analysis
      await this.storage.storeAnalysis(submissionId, analysis);
      
      return {
        success: true,
        type: 'thinking_tool',
        submissionId,
        analysis: analysis.text,
        insights: analysis.insights,
        suggestions: analysis.suggestions
      };
      
    } catch (error) {
      console.error('🚫 Thinking tool processing error:', error);
      throw error;
    }
  }
}
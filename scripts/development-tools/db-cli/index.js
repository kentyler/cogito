#!/usr/bin/env node

/**
 * Database Agent CLI - Main orchestrator
 * Interactive database operations with modular command handling
 */

import { DatabaseAgent } from '../../../lib/database-agent.js';
import { SchemaCommands } from './schema-commands.js';
import { TranscriptCommands } from './transcript-commands.js';
import { ParticipantCommands } from './participant-commands.js';
import { QueryCommands } from './query-commands.js';
import { HelpUtils } from './help-utils.js';

export class DatabaseAgentCLI {
  constructor() {
    this.dbAgent = new DatabaseAgent();
    
    // Initialize command handlers
    this.schemaCommands = new SchemaCommands(this.dbAgent);
    this.transcriptCommands = new TranscriptCommands(this.dbAgent);
    this.participantCommands = new ParticipantCommands(this.dbAgent);
    this.queryCommands = new QueryCommands(this.dbAgent);
  }

  /**
   * Main CLI entry point
   */
  async run() {
    const command = process.argv[2];
    const args = process.argv.slice(3);

    try {
      await this.dbAgent.connect();
      
      switch (command) {
        case 'schema':
          await this.schemaCommands.showSchema(args[0]);
          break;
          
        case 'transcript':
          await this.transcriptCommands.handleTranscript(args);
          break;
          
        case 'participant':
          await this.participantCommands.showParticipant(args[0]);
          break;
          
        case 'query':
          await this.queryCommands.runQuery(args.join(' '));
          break;
          
        case 'test':
          await this.queryCommands.testConnection();
          break;
          
        default:
          HelpUtils.showHelp();
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    } finally {
      await this.dbAgent.close();
    }
  }
}

// Run CLI if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const cli = new DatabaseAgentCLI();
  cli.run();
}
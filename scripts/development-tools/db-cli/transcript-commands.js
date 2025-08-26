/**
 * Transcript Commands - Handle transcript import, analysis, and search
 */

export class TranscriptCommands {
  constructor(dbAgent) {
    this.dbAgent = dbAgent;
  }

  /**
   * Handle transcript-related commands
   * @param {array} args - Command arguments
   */
  async handleTranscript(args) {
    const subcommand = args[0];
    
    switch (subcommand) {
      case 'list':
        await this.listTranscripts();
        break;
        
      case 'import':
        await this.importTranscript(args);
        break;
        
      case 'analyze':
        await this.analyzeTranscript(args);
        break;
        
      case 'search':
        await this.searchTranscripts(args);
        break;
        
      default:
        console.log('Unknown transcript command. Use: list, import, analyze, or search');
    }
  }

  /**
   * List recent transcripts
   */
  async listTranscripts() {
    const transcripts = await this.dbAgent.getMeetingTranscripts({ limit: 20 });
    console.log(`\n📄 Recent Transcripts (${transcripts.length} turns):`);
    
    const meetings = {};
    transcripts.forEach(t => {
      const key = t.meeting_id || t.block_name || 'No Meeting';
      if (!meetings[key]) meetings[key] = [];
      meetings[key].push(t);
    });
    
    Object.entries(meetings).forEach(([meeting, turns]) => {
      console.log(`\n${meeting}:`);
      turns.slice(0, 3).forEach(t => {
        console.log(`  ${t.participant_name}: ${t.content.substring(0, 100)}...`);
      });
      if (turns.length > 3) console.log(`  ... and ${turns.length - 3} more turns`);
    });
  }

  /**
   * Import transcript from file
   * @param {array} args - Command arguments
   */
  async importTranscript(args) {
    const filePath = args[1];
    if (!filePath) {
      console.error('Please provide a file path');
      return;
    }
    
    const meetingId = args.find(a => a.startsWith('--meeting-id='))?.split('=')[1];
    const result = await this.dbAgent.importTranscript({
      filePath,
      meetingId,
      meetingTitle: `Imported from ${filePath}`
    });
    
    console.log(`\n✅ Transcript imported successfully!`);
    console.log(`  Block ID: ${result.blockId}`);
    console.log(`  Turns imported: ${result.turnsImported}`);
  }

  /**
   * Analyze transcript
   * @param {array} args - Command arguments
   */
  async analyzeTranscript(args) {
    const blockId = args[1];
    if (!blockId) {
      console.error('Please provide a block ID');
      return;
    }
    
    const analysis = await this.dbAgent.analyzeTranscript(blockId);
    console.log(`\n📊 Transcript Analysis for Block ${blockId}:`);
    console.log(`  Total turns: ${analysis.totalTurns}`);
    console.log(`  Average turn length: ${analysis.averageTurnLength} chars`);
    
    if (analysis.timeSpan) {
      console.log(`  Duration: ${analysis.timeSpan.durationMinutes} minutes`);
    }
    
    console.log('\n  Participants:');
    Object.entries(analysis.participants).forEach(([name, stats]) => {
      console.log(`    - ${name}: ${stats.turnCount} turns, ${stats.totalWords} words`);
    });
  }

  /**
   * Search transcripts
   * @param {array} args - Command arguments
   */
  async searchTranscripts(args) {
    const searchTerm = args.slice(1).join(' ');
    if (!searchTerm) {
      console.error('Please provide a search term');
      return;
    }
    
    const results = await this.dbAgent.searchTranscripts(searchTerm);
    console.log(`\n🔍 Search results for "${searchTerm}" (${results.length} matches):`);
    
    results.slice(0, 5).forEach(r => {
      console.log(`\n${r.participant_name} in ${r.block_name || 'Unknown'} (relevance: ${r.rank.toFixed(3)}):`);
      console.log(`  "${r.content.substring(0, 200)}..."`);
    });
  }
}
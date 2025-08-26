/**
 * Participant Commands - Handle participant information and statistics
 */

export class ParticipantCommands {
  constructor(dbAgent) {
    this.dbAgent = dbAgent;
  }

  /**
   * Show participant information and statistics
   * @param {string} identifier - Participant ID, email, or name
   */
  async showParticipant(identifier) {
    if (!identifier) {
      console.error('Please provide a participant ID or email');
      return;
    }
    
    // Try to find participant using DatabaseAgent user operations
    const result = await this.dbAgent.connector.query(
      'SELECT * FROM participants WHERE id = $1 OR email = $1 OR name = $1',
      [identifier]
    );
    
    if (result.rows.length === 0) {
      console.log('Participant not found');
      return;
    }
    
    const participant = result.rows[0];
    const stats = await this.dbAgent.getParticipantStats(participant.id);
    
    console.log(`\n👤 Participant: ${participant.name}`);
    console.log(`  ID: ${participant.id}`);
    console.log(`  Email: ${participant.email || 'N/A'}`);
    console.log(`  Type: ${participant.type}`);
    console.log(`  Active: ${participant.is_active}`);
    
    if (stats) {
      console.log(`\n📊 Statistics:`);
      console.log(`  Total turns: ${stats.total_turns || 0}`);
      console.log(`  Total blocks: ${stats.total_blocks || 0}`);
      console.log(`  Average turn length: ${Math.round(stats.avg_turn_length || 0)} chars`);
      
      if (stats.first_turn) {
        console.log(`  First turn: ${new Date(stats.first_turn).toLocaleDateString()}`);
        console.log(`  Last turn: ${new Date(stats.last_turn).toLocaleDateString()}`);
      }
    }
    
    if (participant.patterns && Object.keys(participant.patterns).length > 0) {
      console.log(`\n🎯 Patterns:`);
      Object.entries(participant.patterns).forEach(([key, value]) => {
        console.log(`  ${key}: ${JSON.stringify(value)}`);
      });
    }
  }
}
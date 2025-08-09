/**
 * Transcript Analyzer - Handle transcript analysis and statistics
 */

export class TranscriptAnalyzer {
  constructor(connector) {
    this.connector = connector;
  }

  /**
   * Analyze transcript for a meeting
   */
  async analyzeTranscript(meetingId) {
    console.log(`🔍 Analyzing transcript for meeting: ${meetingId}`);
    
    const query = `
      SELECT 
        t.id,
        t.content,
        t.metadata,
        t.timestamp,
        m.name as meeting_name,
        m.meeting_type
      FROM meetings.turns t
      JOIN meetings m ON t.id = m.id
      WHERE t.id = $1
      ORDER BY t.timestamp
    `;
    
    const result = await this.connector.query(query, [meetingId]);
    const turns = result.rows;
    
    if (turns.length === 0) {
      return {
        meetingId,
        error: 'No turns found for this meeting',
        analysis: null
      };
    }
    
    // Basic analysis
    const analysis = {
      meetingId,
      meetingName: turns[0].meeting_name,
      meetingType: turns[0].meeting_type,
      totalTurns: turns.length,
      totalWords: 0,
      averageWordsPerTurn: 0,
      speakers: new Set(),
      timespan: {
        start: turns[0].timestamp,
        end: turns[turns.length - 1].timestamp
      },
      speakerStats: {}
    };
    
    // Analyze each turn
    for (const turn of turns) {
      const words = turn.content.split(/\s+/).length;
      analysis.totalWords += words;
      
      // Extract speaker from metadata
      const speaker = turn.metadata?.speaker || 'Unknown';
      analysis.speakers.add(speaker);
      
      // Track speaker stats
      if (!analysis.speakerStats[speaker]) {
        analysis.speakerStats[speaker] = {
          turns: 0,
          words: 0,
          averageWordsPerTurn: 0
        };
      }
      
      analysis.speakerStats[speaker].turns++;
      analysis.speakerStats[speaker].words += words;
    }
    
    // Calculate averages
    analysis.averageWordsPerTurn = Math.round(analysis.totalWords / analysis.totalTurns);
    analysis.speakers = Array.from(analysis.speakers);
    
    // Calculate speaker averages
    for (const speaker of analysis.speakers) {
      const stats = analysis.speakerStats[speaker];
      stats.averageWordsPerTurn = Math.round(stats.words / stats.turns);
    }
    
    console.log(`📊 Analysis complete: ${analysis.totalTurns} turns, ${analysis.totalWords} words, ${analysis.speakers.length} speakers`);
    
    return { analysis, success: true };
  }
}
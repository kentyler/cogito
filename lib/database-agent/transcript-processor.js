/**
 * Transcript Processor - Handle transcript operations and analysis
 */

import fs from 'fs/promises';

export class TranscriptProcessor {
  constructor(connector) {
    this.connector = connector;
  }

  /**
   * Get meeting transcripts with flexible filtering
   */
  async getMeetingTranscripts(options = {}) {
    const {
      meetingId,
      clientId,
      participantId,
      sourceType,
      startDate,
      endDate,
      limit = 100,
      offset = 0,
      includeContent = true
    } = options;

    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    // Build dynamic WHERE clause
    if (meetingId) {
      whereConditions.push(`m.meeting_id = $${paramIndex++}`);
      params.push(meetingId);
    }
    
    if (clientId) {
      whereConditions.push(`m.client_id = $${paramIndex++}`);
      params.push(clientId);
    }
    
    if (sourceType) {
      whereConditions.push(`t.source_type = $${paramIndex++}`);
      params.push(sourceType);
    }
    
    if (startDate) {
      whereConditions.push(`t.timestamp >= $${paramIndex++}`);
      params.push(startDate);
    }
    
    if (endDate) {
      whereConditions.push(`t.timestamp <= $${paramIndex++}`);
      params.push(endDate);
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    const contentField = includeContent ? 't.content,' : '';

    const query = `
      SELECT 
        m.meeting_id,
        m.name as meeting_name,
        m.meeting_type,
        t.turn_id,
        ${contentField}
        t.source_type,
        t.timestamp,
        t.created_at
      FROM meetings m
      LEFT JOIN turns t ON m.meeting_id = t.meeting_id
      ${whereClause}
      ORDER BY m.created_at DESC, t.timestamp ASC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    params.push(limit, offset);

    try {
      const result = await this.connector.query(query, params);
      return {
        transcripts: result.rows,
        total: result.rows.length,
        limit,
        offset
      };
    } catch (error) {
      console.error('❌ Error fetching meeting transcripts:', error);
      throw error;
    }
  }

  /**
   * Process and import a transcript file
   */
  async importTranscript(options) {
    const { 
      filePath, 
      meetingTitle, 
      meetingId, 
      clientId = 6, // Default to Cogito
      parseFunction 
    } = options;

    // Read and parse the transcript
    const content = await fs.readFile(filePath, 'utf-8');
    const turns = parseFunction ? parseFunction(content) : this.parseBasicTranscript(content);

    return await this.connector.transaction(async (client) => {
      // Note: Working directly with meetings, no intermediate block needed
      // If no meetingId provided, create a new meeting for this transcript
      let actualMeetingId = meetingId;
      if (!meetingId) {
        const meetingResult = await client.query(`
          INSERT INTO meetings (name, description, meeting_type, metadata, client_id)
          VALUES ($1, $2, 'transcript_import', $3, $4)
          RETURNING meeting_id
        `, [
          meetingTitle || `Imported Transcript ${new Date().toISOString()}`,
          `Transcript imported from ${filePath}`,
          { 
            source_file: filePath,
            imported_at: new Date().toISOString()
          },
          clientId
        ]);
        actualMeetingId = meetingResult.rows[0].meeting_id;
      }

      // Process each turn (participant-less approach)
      for (const turn of turns) {
        // Insert turn without participant reference
        const turnResult = await client.query(`
          INSERT INTO turns (
            content, source_type, metadata, timestamp, client_id, meeting_id
          ) VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING turn_id
        `, [
          turn.content,
          'transcript_import',
          { 
            speaker: turn.speaker,
            original_timestamp: turn.timestamp,
            import_source: filePath
          },
          turn.timestamp || new Date(),
          clientId,
          actualMeetingId
        ]);

        console.log(`📝 Imported turn: ${turn.content.substring(0, 50)}...`);
      }

      return {
        meetingId: actualMeetingId,
        turnsImported: turns.length,
        created: !meetingId // true if we created a new meeting
      };
    });
  }

  /**
   * Parse basic transcript format (speaker: content)
   */
  parseBasicTranscript(content) {
    const lines = content.split('\n').filter(line => line.trim());
    const turns = [];
    
    for (const line of lines) {
      // Handle different formats
      const speakerMatch = line.match(/^([^:]+):\s*(.+)$/);
      if (speakerMatch) {
        turns.push({
          speaker: speakerMatch[1].trim(),
          content: speakerMatch[2].trim(),
          timestamp: new Date() // Could be enhanced to parse timestamps
        });
      } else if (line.trim()) {
        // Handle lines without speaker (assume continuation)
        if (turns.length > 0) {
          turns[turns.length - 1].content += ' ' + line.trim();
        } else {
          turns.push({
            speaker: 'Unknown',
            content: line.trim(),
            timestamp: new Date()
          });
        }
      }
    }
    
    return turns;
  }

  /**
   * Analyze transcript for patterns and insights
   */
  async analyzeTranscript(meetingId) {
    try {
      // Get all turns for this meeting
      const turnsResult = await this.connector.query(`
        SELECT 
          turn_id, content, source_type, timestamp,
          metadata->>'speaker' as speaker
        FROM turns 
        WHERE meeting_id = $1 
        ORDER BY timestamp ASC
      `, [meetingId]);

      const turns = turnsResult.rows;
      
      if (turns.length === 0) {
        return { error: 'No turns found for this meeting' };
      }

      // Basic analysis
      const speakers = [...new Set(turns.map(t => t.speaker || 'Unknown'))];
      const totalWords = turns.reduce((sum, turn) => 
        sum + (turn.content ? turn.content.split(' ').length : 0), 0
      );
      
      const speakerStats = speakers.map(speaker => {
        const speakerTurns = turns.filter(t => (t.speaker || 'Unknown') === speaker);
        const speakerWords = speakerTurns.reduce((sum, turn) => 
          sum + (turn.content ? turn.content.split(' ').length : 0), 0
        );
        
        return {
          speaker,
          turns: speakerTurns.length,
          words: speakerWords,
          participation: totalWords > 0 ? (speakerWords / totalWords * 100).toFixed(1) : 0
        };
      });

      return {
        meetingId,
        totalTurns: turns.length,
        totalWords,
        speakers: speakers.length,
        speakerStats,
        duration: turns.length > 0 ? {
          start: turns[0].timestamp,
          end: turns[turns.length - 1].timestamp
        } : null,
        analyzed_at: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Error analyzing transcript:', error);
      throw error;
    }
  }
}
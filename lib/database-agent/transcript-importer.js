/**
 * Transcript Importer - Handle importing transcript files into database
 */

import fs from 'fs/promises';

export class TranscriptImporter {
  constructor(connector) {
    this.connector = connector;
  }

  /**
   * Import transcript file into database
   */
  async importTranscript(options) {
    const { filePath, clientId, meetingId } = options;
    
    console.log(`📥 Importing transcript from: ${filePath}`);
    console.log(`🆔 Client ID: ${clientId}`);
    console.log(`🎯 Meeting ID: ${meetingId || 'Will create new meeting'}`);

    const fileContent = await fs.readFile(filePath, 'utf-8');
    const turns = this.parseTranscriptFile(fileContent);
    
    console.log(`📄 Parsed ${turns.length} turns from transcript`);

    const client = await this.connector.connect();
    
    try {
      await client.query('BEGIN');
      
      let finalMeetingId = meetingId;
      
      // Create meeting if not provided
      if (!meetingId) {
        const meetingResult = await client.query(`
          INSERT INTO meetings (name, description, meeting_type, metadata, client_id)
          VALUES ($1, $2, 'transcript_import', $3, $4)
          RETURNING meeting_id
        `, [
          `Imported: ${filePath.split('/').pop()}`,
          `Transcript imported from ${filePath}`,
          {
            import_source: filePath,
            import_timestamp: new Date().toISOString(),
            turn_count: turns.length
          },
          clientId
        ]);
        
        finalMeetingId = meetingResult.rows[0].id;
        console.log(`📝 Created meeting: ${finalMeetingId}`);
      }

      // Process each turn (participant-less approach)
      for (const turn of turns) {
        // Insert turn without participant reference
        const turnResult = await client.query(`
          INSERT INTO meetings.turns (
            content, source_type, metadata, timestamp, client_id, id
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
          finalMeetingId
        ]);
        
        console.log(`💬 Imported turn ${turnResult.rows[0].id}: ${turn.speaker}`);
      }
      
      await client.query('COMMIT');
      
      console.log(`✅ Successfully imported ${turns.length} turns to meeting ${finalMeetingId}`);
      
      return {
        meetingId: finalMeetingId,
        turnsImported: turns.length,
        success: true
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Import failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Parse transcript file content into turns
   */
  parseTranscriptFile(content) {
    const lines = content.split('\n').filter(line => line.trim());
    const turns = [];
    
    for (const line of lines) {
      // Try to parse common transcript formats
      const match = line.match(/^(\[.*?\])?(.+?):\s*(.+)$/);
      if (match) {
        const [, timestamp, speaker, content] = match;
        turns.push({
          timestamp: timestamp ? this.parseTimestamp(timestamp) : null,
          speaker: speaker.trim(),
          content: content.trim()
        });
      }
    }
    
    return turns;
  }

  /**
   * Parse timestamp from various formats
   */
  parseTimestamp(timestampStr) {
    try {
      // Remove brackets and try to parse
      const cleaned = timestampStr.replace(/[\[\]]/g, '');
      return new Date(cleaned);
    } catch (error) {
      return null;
    }
  }
}
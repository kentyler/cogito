/**
 * Transcript Processor - Modular version with specialized components
 */

import { TranscriptImporter } from './transcript-importer.js';
import { TranscriptAnalyzer } from './transcript-analyzer.js';

export class TranscriptProcessor {
  constructor(connector) {
    this.connector = connector;
    this.importer = new TranscriptImporter(connector);
    this.analyzer = new TranscriptAnalyzer(connector);
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
      whereConditions.push(`m.id = $${paramIndex++}`);
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
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Select content conditionally
    const contentField = includeContent ? 't.content,' : '';

    const query = `
      SELECT 
        m.id,
        m.name as meeting_name,
        m.meeting_type,
        t.id,
        ${contentField}
        t.source_type,
        t.metadata,
        t.timestamp,
        t.created_at
      FROM meetings m
      JOIN meetings.turns t ON m.id = t.meeting_id
      ${whereClause}
      ORDER BY t.timestamp, t.id
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    params.push(limit, offset);

    const result = await this.connector.query(query, params);
    return result.rows;
  }

  /**
   * Import transcript file - delegate to importer
   */
  async importTranscript(options) {
    return await this.importer.importTranscript(options);
  }

  /**
   * Analyze transcript - delegate to analyzer
   */
  async analyzeTranscript(meetingId) {
    return await this.analyzer.analyzeTranscript(meetingId);
  }
}
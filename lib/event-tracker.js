/**
 * Event Tracking Service for Cogito
 * Handles logging of participant events, system events, and user interactions
 */

import pg from 'pg';
const { Pool } = pg;

/**
 * Event categories
 */
export const EVENT_CATEGORY = {
  CONVERSATION: 'conversation',
  SYSTEM: 'system',
  USER_ACTION: 'user_action',
  AI_RESPONSE: 'ai_response',
  FILE_OPERATION: 'file_operation',
  SEARCH: 'search'
};

/**
 * Event types mapped to database IDs
 * These should match the IDs in participant_event_types table
 */
export const EVENT_TYPE = {
  // Conversation events
  PROMPT_SUBMITTED: 1,
  RESPONSE_GENERATED: 2,
  SESSION_STARTED: 3,
  SESSION_ENDED: 4,
  
  // File operation events
  FILE_UPLOADED: 5,
  FILE_PROCESSED: 6,
  FILE_DELETED: 7,
  
  // Search events
  SEMANTIC_SEARCH: 8,
  FILE_SEARCH: 9,
  
  // User action events
  BUTTON_CLICKED: 10,
  CONTEXT_SWITCHED: 11,
  
  // System events
  ERROR_OCCURRED: 12,
  SERVICE_STARTED: 13,
  MAINTENANCE_PERFORMED: 14
};

export class EventTracker {
  constructor() {
    // Use same Supabase connection as Cogito
    this.pool = new Pool({
      connectionString: 'postgresql://user:password@host/database',
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }

  /**
   * Create a participant event (simpler logging)
   * @param {Object} eventData
   * @param {number} eventData.participantId - Participant ID
   * @param {number} eventData.eventTypeId - Event type ID from EVENT_TYPE
   * @param {Object} eventData.details - Event details as JSON
   * @param {number} eventData.clientId - Client ID (default: 6 for Cogito)
   */
  async createEvent(eventData) {
    const {
      participantId,
      eventTypeId,
      details = {},
      clientId = 6
    } = eventData;

    try {
      const result = await this.pool.query(`
        INSERT INTO participant_events
        (participant_id, event_type_id, details, client_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [participantId, eventTypeId, details, clientId]);

      return result.rows[0];
    } catch (error) {
      console.error('Error creating participant event:', error);
      throw error;
    }
  }

  /**
   * Log an event with full details (comprehensive logging)
   * @param {Object} eventData
   * @param {number} eventData.participantId - Participant ID
   * @param {number} eventData.eventTypeId - Event type ID
   * @param {string} eventData.description - Human-readable description
   * @param {Object} eventData.details - Additional details as JSON
   * @param {string} eventData.ipAddress - Client IP address
   * @param {string} eventData.userAgent - User agent string
   * @param {number} eventData.clientId - Client ID (default: 6)
   */
  async logEvent(eventData) {
    const {
      participantId,
      eventTypeId,
      description,
      details = {},
      ipAddress,
      userAgent,
      clientId = 6
    } = eventData;

    try {
      const result = await this.pool.query(`
        INSERT INTO participant_event_logs
        (participant_id, event_type_id, description, details, ip_address, user_agent, client_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [participantId, eventTypeId, description, details, ipAddress, userAgent, clientId]);

      return result.rows[0];
    } catch (error) {
      console.error('Error logging event:', error);
      throw error;
    }
  }

  /**
   * Log a conversation turn event
   * @param {Object} turnData
   * @param {number} turnData.participantId
   * @param {string} turnData.sessionId
   * @param {string} turnData.interactionType - 'human_input' or 'ai_response'
   * @param {string} turnData.content - First 100 chars of content
   */
  async logConversationTurn(turnData) {
    const { participantId, sessionId, interactionType, content } = turnData;
    
    const eventTypeId = interactionType === 'human_input' 
      ? EVENT_TYPE.PROMPT_SUBMITTED 
      : EVENT_TYPE.RESPONSE_GENERATED;

    return this.createEvent({
      participantId,
      eventTypeId,
      details: {
        sessionId,
        contentPreview: content.substring(0, 100),
        interactionType
      }
    });
  }

  /**
   * Log file operation event
   * @param {Object} fileData
   * @param {number} fileData.participantId
   * @param {string} fileData.operation - 'upload', 'process', 'delete'
   * @param {number} fileData.fileId
   * @param {string} fileData.filename
   * @param {Object} fileData.metadata - Additional file metadata
   */
  async logFileOperation(fileData) {
    const { participantId, operation, fileId, filename, metadata = {} } = fileData;
    
    const eventTypeMap = {
      'upload': EVENT_TYPE.FILE_UPLOADED,
      'process': EVENT_TYPE.FILE_PROCESSED,
      'delete': EVENT_TYPE.FILE_DELETED
    };

    return this.createEvent({
      participantId,
      eventTypeId: eventTypeMap[operation],
      details: {
        fileId,
        filename,
        ...metadata
      }
    });
  }

  /**
   * Log search event
   * @param {Object} searchData
   * @param {number} searchData.participantId
   * @param {string} searchData.searchType - 'semantic' or 'file'
   * @param {string} searchData.query
   * @param {number} searchData.resultCount
   * @param {number} searchData.latencyMs
   */
  async logSearch(searchData) {
    const { participantId, searchType, query, resultCount, latencyMs } = searchData;
    
    const eventTypeId = searchType === 'semantic' 
      ? EVENT_TYPE.SEMANTIC_SEARCH 
      : EVENT_TYPE.FILE_SEARCH;

    return this.createEvent({
      participantId,
      eventTypeId,
      details: {
        query,
        resultCount,
        latencyMs
      }
    });
  }

  /**
   * Log button click event
   * @param {Object} clickData
   * @param {number} clickData.participantId
   * @param {string} clickData.buttonLabel
   * @param {string} clickData.promptText
   */
  async logButtonClick(clickData) {
    const { participantId, buttonLabel, promptText } = clickData;
    
    return this.createEvent({
      participantId,
      eventTypeId: EVENT_TYPE.BUTTON_CLICKED,
      details: {
        buttonLabel,
        promptText
      }
    });
  }

  /**
   * Get participant events
   * @param {number} participantId
   * @param {Object} options
   * @param {number} options.limit
   * @param {number} options.offset
   * @param {number} options.eventTypeId - Filter by event type
   */
  async getParticipantEvents(participantId, options = {}) {
    const { limit = 50, offset = 0, eventTypeId } = options;
    
    let query = `
      SELECT 
        pe.*,
        pt.name as event_type_name,
        pt.description as event_type_description,
        pc.name as category_name
      FROM participant_events pe
      JOIN participant_event_types pt ON pe.event_type_id = pt.id
      LEFT JOIN participant_event_categories pc ON pt.participant_event_categories_id = pc.id
      WHERE pe.participant_id = $1 AND pe.client_id = $2
    `;
    
    const params = [participantId, 6];
    
    if (eventTypeId) {
      query += ' AND pe.event_type_id = $3';
      params.push(eventTypeId);
    }
    
    query += ' ORDER BY pe.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);
    
    try {
      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error getting participant events:', error);
      throw error;
    }
  }

  /**
   * Get event logs with full details
   * @param {Object} options
   * @param {number} options.participantId
   * @param {Date} options.startDate
   * @param {Date} options.endDate
   * @param {number} options.eventTypeId
   */
  async getEventLogs(options = {}) {
    const { participantId, startDate, endDate, eventTypeId } = options;
    
    let query = `
      SELECT 
        el.*,
        pt.name as event_type_name,
        p.name as participant_name
      FROM participant_event_logs el
      LEFT JOIN participant_event_types pt ON el.event_type_id = pt.id
      LEFT JOIN participants p ON el.participant_id = p.id
      WHERE el.client_id = $1
    `;
    
    const params = [6];
    let paramCount = 1;
    
    if (participantId) {
      query += ` AND el.participant_id = $${++paramCount}`;
      params.push(participantId);
    }
    
    if (eventTypeId) {
      query += ` AND el.event_type_id = $${++paramCount}`;
      params.push(eventTypeId);
    }
    
    if (startDate) {
      query += ` AND el.created_at >= $${++paramCount}`;
      params.push(startDate);
    }
    
    if (endDate) {
      query += ` AND el.created_at <= $${++paramCount}`;
      params.push(endDate);
    }
    
    query += ' ORDER BY el.created_at DESC LIMIT 100';
    
    try {
      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error getting event logs:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const eventTracker = new EventTracker();
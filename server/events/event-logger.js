/**
 * Lightweight EventLogger for database logging
 * Integrates with existing error handling patterns
 */
export class EventLogger {
  constructor(pool) {
    this.pool = pool;
    this.eventTypeCache = new Map();
  }

  async getOrCreateEventType(eventName, description = null) {
    if (this.eventTypeCache.has(eventName)) {
      return this.eventTypeCache.get(eventName);
    }

    try {
      let result = await this.pool.query(
        'SELECT id FROM events.event_types WHERE event_name = $1',
        [eventName]
      );

      if (result.rows.length === 0) {
        result = await this.pool.query(`
          INSERT INTO events.event_types (event_name, description, created_at)
          VALUES ($1, $2, NOW()) RETURNING id
        `, [eventName, description]);
      }

      const eventTypeId = result.rows[0].id;
      this.eventTypeCache.set(eventName, eventTypeId);
      return eventTypeId;
    } catch (error) {
      console.error('Failed to get/create event type:', error);
      return null;
    }
  }

  async logError(eventName, error, context = {}) {
    try {
      const eventTypeId = await this.getOrCreateEventType(
        eventName, 
        `Error event: ${eventName}`
      );
      
      if (!eventTypeId) return null;

      const eventData = {
        error_message: error.message || String(error),
        error_stack: error.stack || null,
        error_type: error.constructor.name,
        endpoint: context.endpoint,
        request_data: context.requestBody
      };

      const metadata = {
        user_id: context.userId,
        session_id: context.sessionId,
        ip_address: context.ip,
        user_agent: context.userAgent,
        timestamp: new Date().toISOString(),
        severity: 'error'
      };

      const eventId = Date.now();
      
      await this.pool.query(`
        INSERT INTO events.events (id, event_type_id, user_id, session_id, event_data, metadata, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        eventId,
        eventTypeId,
        context.userId || null,
        context.sessionId || null,
        JSON.stringify(eventData),
        JSON.stringify(metadata)
      ]);

      return eventId;
    } catch (logError) {
      console.error('Failed to log error to database:', logError);
      return null;
    }
  }

  async logEvent(eventName, eventData, context = {}) {
    try {
      const eventTypeId = await this.getOrCreateEventType(
        eventName, 
        `Application event: ${eventName}`
      );
      
      if (!eventTypeId) return null;

      const metadata = {
        user_id: context.userId,
        session_id: context.sessionId,
        timestamp: new Date().toISOString(),
        severity: context.severity || 'info'
      };

      const eventId = Date.now();
      
      await this.pool.query(`
        INSERT INTO events.events (id, event_type_id, user_id, session_id, event_data, metadata, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        eventId,
        eventTypeId,
        context.userId || null,
        context.sessionId || null,
        JSON.stringify(eventData),
        JSON.stringify(metadata)
      ]);

      return eventId;
    } catch (logError) {
      console.error('Failed to log event to database:', logError);
      return null;
    }
  }
}

// Helper function to extract context from Express request
export function extractRequestContext(req) {
  return {
    userId: req.session?.user?.user_id || req.session?.user?.id,
    sessionId: req.sessionID,
    endpoint: `${req.method} ${req.path}`,
    requestBody: req.body,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('User-Agent')
  };
}
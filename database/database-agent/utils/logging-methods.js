/**
 * Logging utility methods for DatabaseAgent
 */

/**
 * Log a general event to the database
 * @param {Object} dbAgent - DatabaseAgent instance
 * @param {string} eventType - Type of event
 * @param {Object} eventData - Event data
 * @param {Object} context - Context information
 * @returns {Promise<void>}
 */
// Database columns verified: event_type_id, user_id, session_id exist in events.events table
export async function logEvent(dbAgent, eventType, eventData, context = {}) {
  try {
    const eventTypeId = await dbAgent.connector.query(
      'SELECT id FROM events.event_types WHERE event_name = $1',
      [eventType]
    );

    if (eventTypeId.rows.length === 0) {
      console.error(`Unknown event type: ${eventType}`);
      return;
    }

    await dbAgent.connector.query(
      `INSERT INTO events.events (event_type_id, user_id, session_id, event_data, metadata) 
       VALUES ($1, $2, $3, $4, $5)`,
      [
        eventTypeId.rows[0].id,
        context.userId || null,
        context.sessionId || null,
        eventData,
        {
          endpoint: context.endpoint || null,
          ip: context.ip || null,
          userAgent: context.userAgent || null,
          severity: context.severity || 'info',
          component: context.component || 'Application',
          timestamp: new Date().toISOString()
        }
      ]
    );
  } catch (error) {
    console.error('Failed to log event:', error);
  }
}

/**
 * Log an error to the database
 * @param {Object} dbAgent - DatabaseAgent instance
 * @param {string} errorType - Type of error
 * @param {Error} error - Error object
 * @param {Object} context - Context information
 * @returns {Promise<void>}
 */
export async function logError(dbAgent, errorType, error, context = {}) {
  return await logEvent(dbAgent, errorType, {
    error_message: error.message,
    error_stack: error.stack,
    error_name: error.name,
    timestamp: new Date().toISOString()
  }, {
    ...context,
    severity: 'error'
  });
}

/**
 * Log authentication events
 * @param {Object} dbAgent - DatabaseAgent instance
 * @param {string} eventType - Auth event type
 * @param {Object} userData - User data
 * @param {Object} context - Context information
 * @returns {Promise<void>}
 */
export async function logAuthEvent(dbAgent, eventType, userData, context = {}) {
  return await logEvent(dbAgent, eventType, {
    user_id: userData.user_id || userData.id,
    email: userData.email,
    timestamp: new Date().toISOString()
  }, {
    ...context,
    severity: context.severity || 'info',
    component: context.component || 'Authentication'
  });
}

/**
 * Log client management events
 * @param {Object} dbAgent - DatabaseAgent instance
 * @param {string} eventType - Client event type
 * @param {Object} clientData - Client data
 * @param {Object} context - Context information
 * @returns {Promise<void>}
 */
export async function logClientEvent(dbAgent, eventType, clientData, context = {}) {
  return await logEvent(dbAgent, eventType, {
    client_id: clientData.client_id || clientData.id,
    client_name: clientData.client_name || clientData.name,
    timestamp: new Date().toISOString()
  }, {
    ...context,
    severity: context.severity || 'info',
    component: context.component || 'ClientManagement'
  });
}

/**
 * Log database operation events
 * @param {Object} dbAgent - DatabaseAgent instance
 * @param {string} eventType - Database event type
 * @param {Object} operationData - Operation data
 * @param {Object} context - Context information
 * @returns {Promise<void>}
 */
export async function logDatabaseEvent(dbAgent, eventType, operationData, context = {}) {
  return await logEvent(dbAgent, eventType, {
    ...operationData,
    timestamp: new Date().toISOString()
  }, {
    ...context,
    severity: context.severity || 'info',
    component: context.component || 'DatabaseOperations'
  });
}
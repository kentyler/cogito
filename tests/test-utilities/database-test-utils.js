/**
 * Database Test Utilities
 * Provides consistent database setup and utilities for all smoke tests
 */

import { DatabaseAgent } from '../../lib/database-agent-modular.js';

class DatabaseTestUtils {
  
  /**
   * Create a test database agent with dev database connection
   * @returns {Promise<DatabaseAgent>} Connected database agent
   */
  static async createTestDatabaseAgent() {
    const dbAgent = new DatabaseAgent();
    await dbAgent.connect();
    return dbAgent;
  }

  /**
   * Create mock Express request object for API testing
   * @param {Object} options
   * @param {Object} [options.body={}] - Request body
   * @param {Object} [options.params={}] - Request params
   * @param {Object} [options.query={}] - Query parameters
   * @param {Object} [options.headers={}] - Request headers
   * @param {string} [options.userId='test-user-123'] - User ID for session
   * @param {DatabaseAgent} [options.dbAgent] - Database agent to attach
   * @returns {Object} Mock Express request object
   */
  static createMockRequest({ 
    body = {}, 
    params = {}, 
    query = {}, 
    headers = {},
    userId = 'test-user-123',
    dbAgent 
  } = {}) {
    return {
      body,
      params,
      query,
      headers,
      session: {
        user: { user_id: userId },
        meeting_id: 'test-meeting-123'
      },
      pool: dbAgent,
      // Common properties for testing
      ip: '127.0.0.1',
      method: 'POST',
      url: '/api/test',
      cookies: {}
    };
  }

  /**
   * Create mock Express response object for API testing  
   * @returns {Object} Mock Express response object with spy functions
   */
  static createMockResponse() {
    const response = {
      statusCode: 200,
      headers: {},
      sent: false,
      data: null
    };

    response.json = function(data) {
      response.sent = true;
      response.data = data;
      return response;
    };

    response.status = function(code) {
      response.statusCode = code;
      return response;
    };

    response.send = function(data) {
      response.sent = true;
      response.data = data;
      return response;
    };

    response.setHeader = function(name, value) {
      response.headers[name] = value;
      return response;
    };

    response.end = function(data) {
      response.sent = true;
      if (data) response.data = data;
      return response;
    };

    return response;
  }

  /**
   * Create test client record for testing client-related functions
   * @param {DatabaseAgent} dbAgent - Database agent
   * @param {Object} [options] - Client options
   * @returns {Promise<Object>} Created client record
   */
  static async createTestClient(dbAgent, options = {}) {
    const client = {
      client_id: options.client_id || 'test-client-' + Date.now(),
      display_name: options.display_name || 'Test Client',
      created_at: new Date().toISOString(),
      is_active: options.is_active !== undefined ? options.is_active : true,
      ...options
    };

    try {
      const result = await dbAgent.query(
        'INSERT INTO client_mgmt.clients (client_id, display_name, created_at, is_active) VALUES ($1, $2, $3, $4) RETURNING *',
        [client.client_id, client.display_name, client.created_at, client.is_active]
      );
      
      return result.rows[0];
    } catch (error) {
      // If client already exists, return it
      if (error.code === '23505') { // unique violation
        const existingResult = await dbAgent.query(
          'SELECT * FROM client_mgmt.clients WHERE client_id = $1',
          [client.client_id]
        );
        return existingResult.rows[0];
      }
      throw error;
    }
  }

  /**
   * Create test meeting record
   * @param {DatabaseAgent} dbAgent - Database agent
   * @param {Object} [options] - Meeting options
   * @returns {Promise<Object>} Created meeting record
   */
  static async createTestMeeting(dbAgent, options = {}) {
    const meeting = {
      meeting_type: options.meeting_type || 'test_meeting',
      client_id: options.client_id || 'test-client-123',
      created_at: new Date().toISOString(),
      ...options
    };

    try {
      const result = await dbAgent.query(
        'INSERT INTO meetings.meetings (meeting_type, client_id, created_at) VALUES ($1, $2, $3) RETURNING *',
        [meeting.meeting_type, meeting.client_id, meeting.created_at]
      );
      
      return result.rows[0];
    } catch (error) {
      console.warn('Could not create test meeting:', error.message);
      // Return mock meeting for tests that don't need real database records
      return {
        meeting_id: 'test-meeting-' + Date.now(),
        ...meeting
      };
    }
  }

  /**
   * Clean up test data after test completion
   * @param {DatabaseAgent} dbAgent - Database agent
   * @param {Object} [options] - Cleanup options
   * @returns {Promise<void>}
   */
  static async cleanupTestData(dbAgent, options = {}) {
    if (!options.skipCleanup) {
      try {
        // Clean up test records (be careful with this in production!)
        if (options.clientIds && options.clientIds.length > 0) {
          await dbAgent.query(
            'DELETE FROM client_mgmt.clients WHERE client_id = ANY($1)',
            [options.clientIds]
          );
        }

        if (options.meetingIds && options.meetingIds.length > 0) {
          await dbAgent.query(
            'DELETE FROM meetings.meetings WHERE meeting_id = ANY($1)',
            [options.meetingIds]
          );
        }

        // Clean up any test turns
        await dbAgent.query(
          "DELETE FROM conversation.turns WHERE content LIKE '%test%' AND created_at > NOW() - INTERVAL '1 hour'"
        );

        console.log('✅ Test data cleanup completed');
      } catch (error) {
        console.warn('⚠️ Test cleanup failed (may be expected):', error.message);
      }
    }
  }

  /**
   * Verify database connection and basic functionality
   * @param {DatabaseAgent} dbAgent - Database agent to test
   * @returns {Promise<boolean>} True if database is working correctly
   */
  static async verifyDatabaseConnection(dbAgent) {
    try {
      // Test basic query
      const timeResult = await dbAgent.query('SELECT NOW() as current_time');
      if (!timeResult.rows || timeResult.rows.length === 0) {
        return false;
      }

      // Test schema access
      const schemaResult = await dbAgent.query(
        "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema NOT IN ('information_schema', 'pg_catalog')"
      );
      
      const tableCount = parseInt(schemaResult.rows[0].table_count);
      if (tableCount === 0) {
        console.warn('⚠️ No application tables found in database');
        return false;
      }

      console.log(`✅ Database connection verified: ${tableCount} tables available`);
      return true;
      
    } catch (error) {
      console.error('❌ Database connection verification failed:', error);
      return false;
    }
  }

  /**
   * Get test configuration for different environments
   * @returns {Object} Test configuration
   */
  static getTestConfig() {
    return {
      // Test timeouts
      defaultTimeout: 30000,
      dbTimeout: 10000,
      
      // Test data prefixes
      testClientPrefix: 'test-client-',
      testUserPrefix: 'test-user-',
      testMeetingPrefix: 'test-meeting-',
      
      // Database settings
      useDevDatabase: true,
      autoCleanup: true,
      
      // Test behavior
      skipSlowTests: process.env.SKIP_SLOW_TESTS === 'true',
      verboseOutput: process.env.VERBOSE_TESTS === 'true'
    };
  }

  /**
   * Create comprehensive test setup for a function test
   * @param {Object} [options] - Setup options
   * @returns {Promise<Object>} Test context with database, mocks, etc.
   */
  static async createTestSetup(options = {}) {
    const config = this.getTestConfig();
    
    console.log('🔧 Setting up comprehensive test environment...');
    
    // Create database agent
    const dbAgent = await this.createTestDatabaseAgent();
    
    // Verify database is working
    const dbWorking = await this.verifyDatabaseConnection(dbAgent);
    if (!dbWorking) {
      throw new Error('Database verification failed');
    }
    
    // Create test client if needed
    let testClient = null;
    if (options.needsClient) {
      testClient = await this.createTestClient(dbAgent, {
        client_id: config.testClientPrefix + Date.now()
      });
    }
    
    // Create test meeting if needed  
    let testMeeting = null;
    if (options.needsMeeting) {
      testMeeting = await this.createTestMeeting(dbAgent, {
        client_id: testClient?.client_id || config.testClientPrefix + 'default'
      });
    }
    
    // Create mock request/response
    const mockReq = this.createMockRequest({
      dbAgent,
      userId: config.testUserPrefix + Date.now()
    });
    
    const mockRes = this.createMockResponse();
    
    console.log('✅ Test setup complete');
    
    return {
      dbAgent,
      testClient,
      testMeeting,
      mockReq,
      mockRes,
      config,
      
      // Cleanup function
      cleanup: async () => {
        await this.cleanupTestData(dbAgent, {
          clientIds: testClient ? [testClient.client_id] : [],
          meetingIds: testMeeting ? [testMeeting.meeting_id] : []
        });
        await dbAgent.close();
      }
    };
  }
}

export { DatabaseTestUtils };
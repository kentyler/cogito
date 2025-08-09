/**
 * Test data fixtures for DatabaseAgent tests
 * Handles creation of users, clients, meetings, and turns
 */

export const TestFixtures = {
  /**
   * Generate a unique test email
   */
  generateTestEmail() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `test_${timestamp}_${random}@example.com`;
  },

  /**
   * Create a test user
   */
  async createTestUser(dbAgent, overrides = {}) {
    const userData = {
      email: this.generateTestEmail(),
      password: 'testpass123',
      metadata: { test: true },
      ...overrides
    };
    
    return await dbAgent.users.create(userData);
  },

  /**
   * Create a test client (if needed for client association tests)
   */
  async createTestClient(dbAgent, overrides = {}) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const clientData = {
      name: `Test_Client_${timestamp}_${random}`,
      metadata: { test: true },
      ...overrides
    };
    
    // Get the next available ID
    const maxIdResult = await dbAgent.connector.query('SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM client_mgmt.clients');
    const nextId = maxIdResult.rows[0].next_id;
    
    const query = `
      INSERT INTO client_mgmt.clients (id, name, metadata, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `;
    
    const result = await dbAgent.connector.query(query, [nextId, clientData.name, clientData.metadata]);
    return result.rows[0];
  },

  /**
   * Associate a user with a client
   */
  async associateUserWithClient(dbAgent, userId, clientId, role = 'user') {
    const query = `
      INSERT INTO client_mgmt.user_clients (user_id, client_id, role, is_active, joined_at)
      VALUES ($1, $2, $3, true, NOW())
      RETURNING *
    `;
    
    const result = await dbAgent.connector.query(query, [userId, clientId, role]);
    return result.rows[0];
  },

  /**
   * Create a test meeting
   */
  async createTestMeeting(dbAgent, overrides = {}) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    
    // Create a test user and client if not provided
    const testUser = overrides.created_by_user_id ? 
      null : await this.createTestUser(dbAgent);
    const testClient = overrides.client_id ? 
      null : await this.createTestClient(dbAgent);
    
    const meetingData = {
      name: `Test_Meeting_${timestamp}_${random}`,
      description: `Test meeting created at ${new Date().toISOString()}`,
      meeting_type: 'conversation',
      created_by_user_id: overrides.created_by_user_id || testUser.id,
      client_id: overrides.client_id || testClient.id,
      metadata: { test: true },
      ...overrides
    };
    
    const meeting = await dbAgent.meetings.create(meetingData);
    
    // Return meeting with associated test data for cleanup
    return {
      meeting,
      testUser,
      testClient
    };
  },

  /**
   * Create a test meeting with bot ID for cleanup testing
   */
  async createTestMeetingWithBotId(dbAgent, overrides = {}) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const botId = `test-bot-${timestamp}-${random}`;
    
    const meetingData = {
      name: `Bot_Meeting_${timestamp}`,
      recall_bot_id: botId,
      status: 'active',
      ...overrides
    };
    
    const result = await this.createTestMeeting(dbAgent, meetingData);
    
    // Update with bot_id (not supported in create method)
    await dbAgent.connector.query(
      'UPDATE meetings.meetings SET recall_bot_id = $1 WHERE id = $2',
      [botId, result.meeting.id]
    );
    
    // Fetch updated meeting
    const updatedMeeting = await dbAgent.meetings.getById(result.meeting.id);
    
    return {
      ...result,
      meeting: updatedMeeting,
      botId
    };
  },

  /**
   * Create test turns for a meeting
   */
  async createTestTurns(dbAgent, meetingId, count = 3) {
    const turns = [];
    
    for (let i = 0; i < count; i++) {
      const turnData = {
        meeting_id: meetingId,
        content: `Test turn content ${i + 1}`,
        source_type: 'test',
        metadata: { test: true, sequence: i + 1 },
        timestamp: new Date()
      };
      
      const query = `
        INSERT INTO meetings.turns (id, meeting_id, content, source_type, metadata, timestamp, created_at)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW())
        RETURNING *
      `;
      
      const result = await dbAgent.connector.query(query, [
        turnData.meeting_id,
        turnData.content, 
        turnData.source_type,
        turnData.metadata,
        turnData.timestamp
      ]);
      
      turns.push(result.rows[0]);
    }
    
    return turns;
  }
};
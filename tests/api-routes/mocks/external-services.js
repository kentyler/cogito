/**
 * Mock External Services for API Testing
 * Provides safe mock implementations of external services
 */

// Mock Recall.ai API - safely test without external calls
export const mockRecallApi = {
  createRecallBot: async ({ meetingUrl, websocketUrl, webhookUrl }) => {
    // Simulate successful bot creation with unique IDs
    await new Promise(resolve => setTimeout(resolve, Math.random() * 10)); // Small random delay for uniqueness
    return {
      id: `test-bot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      meeting_url: meetingUrl,
      status: 'joining',
      bot_name: 'Cogito',
      websocket_url: websocketUrl,
      webhook_url: webhookUrl
    };
  },
  
  getWebsocketUrls: () => ({
    websocketUrl: 'ws://test.example.com/transcript',
    webhookUrl: 'http://test.example.com/webhook/chat'
  })
};

// Mock file upload service
export const mockFileUploadService = {
  processFile: async (file, options) => {
    return {
      id: `test-file-${Date.now()}`,
      filename: file.originalname || 'test-file.txt',
      file_size: file.size || 1024,
      client_id: options.clientId,
      description: options.description
    };
  }
};

// Mock database agent for testing
export const createMockDbAgent = () => ({
  connect: async () => {},
  close: async () => {},
  logEvent: async (eventType, eventData, context) => {
    return { eventType, eventData, context };
  },
  logError: async (errorType, error, context) => {
    return { errorType, error, context };
  }
});

// Mock database for bot creation testing
export const createMockDatabase = () => ({
  query: async (sql, params) => {
    // Simulate meeting creation query
    if (sql.includes('INSERT INTO meetings.meetings')) {
      return {
        rows: [{
          id: params[0], // meetingId from params
          name: params[1],
          description: params[2],
          meeting_type: params[3],
          created_by_user_id: params[4],
          client_id: params[5],
          metadata: params[6],
          meeting_url: params[7],
          recall_bot_id: params[8],
          status: params[9],
          created_at: new Date(),
          updated_at: new Date()
        }]
      };
    }
    // Simulate email update query
    if (sql.includes('UPDATE meetings.meetings')) {
      return { rows: [] };
    }
    // Simulate file linking query
    if (sql.includes('INSERT INTO meetings.meeting_files')) {
      return { rows: [] };
    }
    return { rows: [] };
  }
});
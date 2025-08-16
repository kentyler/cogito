// Test refactored meeting service to ensure all functionality works
import { MeetingService } from '../server/services/meeting-service.js';

describe('Refactored Meeting Service', () => {
  let meetingService;
  let mockPool;
  let mockEmailTransporter;

  beforeEach(() => {
    // Mock database pool
    mockPool = {
      query: jest.fn()
    };

    // Mock email transporter
    mockEmailTransporter = jest.fn().mockResolvedValue({
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-123' })
    });

    // Create service with mocks
    meetingService = new MeetingService({
      pool: mockPool,
      getEmailTransporter: mockEmailTransporter,
      meetingLastActivity: new Map()
    });
  });

  test('should initialize all sub-services', () => {
    expect(meetingService.emailService).toBeDefined();
    expect(meetingService.transcriptService).toBeDefined();  
    expect(meetingService.cleanupService).toBeDefined();
  });

  test('should expose buffers for backward compatibility', () => {
    expect(meetingService.meetingBuffers).toBeDefined();
    expect(meetingService.meetingSpeakerAgents).toBeDefined();
  });

  test('should append to conversation', async () => {
    // Mock database response
    mockPool.query.mockResolvedValueOnce({
      rows: [{ full_transcript: [] }]
    });
    mockPool.query.mockResolvedValueOnce({ rows: [] }); // Update query

    const result = await meetingService.appendToConversation('test-123', 'Test message');
    
    expect(result).toBe(true);
    expect(mockPool.query).toHaveBeenCalledTimes(2);
  });

  test('should delegate methods to appropriate sub-services', () => {
    // Test delegation methods exist
    expect(typeof meetingService.processTranscriptChunk).toBe('function');
    expect(typeof meetingService.endMeetingTranscriptProcessing).toBe('function');
    expect(typeof meetingService.completeMeetingByInactivity).toBe('function');
    expect(typeof meetingService.sendTranscriptEmail).toBe('function');
    expect(typeof meetingService.cleanupInactiveMeetings).toBe('function');
  });

  test('should handle agent class initialization', () => {
    const mockTranscriptBufferAgent = jest.fn();
    const mockTurnEmbeddingAgent = jest.fn();
    const mockSpeakerProfileAgent = jest.fn();
    const mockEmbeddingAgent = jest.fn();

    // Should not throw
    expect(() => {
      meetingService.setAgentClasses(
        mockTranscriptBufferAgent,
        mockTurnEmbeddingAgent, 
        mockSpeakerProfileAgent,
        mockEmbeddingAgent
      );
    }).not.toThrow();
  });
});
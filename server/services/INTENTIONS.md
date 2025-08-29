# Server Services

## Purpose
Backend business logic services providing core application functionality. These services handle complex operations, external integrations, and background processing while maintaining clean separation from HTTP routes and database operations.

## Service Architecture Philosophy
- **Single Responsibility**: Each service focuses on one specific domain
- **DatabaseAgent Integration**: All database operations go through DatabaseAgent
- **Event-Driven**: Services emit and respond to system events
- **Error Resilience**: Comprehensive error handling and recovery
- **External Integration**: Clean interfaces for third-party services

## Core Service Files

### `meeting-service.js`
**Purpose**: Core meeting lifecycle management and coordination
- Meeting creation from various sources (bots, manual, imports)
- Meeting status management and updates
- Integration with external meeting platforms
- Meeting data processing and normalization

```javascript
export class MeetingService {
  async createMeeting(meetingData, source) {
    // 1. Validate meeting data and source
    // 2. Normalize meeting data format
    // 3. Create meeting record via DatabaseAgent
    // 4. Initialize meeting processing workflow
    // 5. Emit meeting creation event
    // 6. Return meeting with processing status
  }
  
  async processMeetingWebhook(webhookData) {
    // 1. Validate webhook signature and data
    // 2. Update meeting status and metadata
    // 3. Process transcript if available
    // 4. Update meeting completion status
    // 5. Trigger post-processing workflows
  }
}
```

### `webhook-service.js`
**Purpose**: External webhook handling and processing
- Webhook signature verification and security
- Payload normalization from different providers
- Event routing to appropriate services
- Webhook retry and failure handling

```javascript
export class WebhookService {
  async processWebhook(provider, payload, signature) {
    // 1. Verify webhook signature for security
    // 2. Parse and validate payload structure
    // 3. Identify webhook type and target service
    // 4. Route to appropriate service handler
    // 5. Log webhook processing status
    // 6. Return processing confirmation
  }
  
  async handleRecallWebhook(payload) {
    // 1. Process Recall.ai webhook data
    // 2. Update bot and meeting status
    // 3. Handle transcript availability
    // 4. Trigger meeting processing workflow
  }
}
```

### `websocket-service.js`
**Purpose**: Real-time communication and live updates
- WebSocket connection management
- Real-time transcript streaming
- Live meeting status updates
- Client-specific event broadcasting

```javascript
export class WebSocketService {
  async broadcastToClient(clientId, event, data) {
    // 1. Find active connections for client
    // 2. Validate user permissions for data
    // 3. Format event data for transmission
    // 4. Broadcast to all client connections
    // 5. Handle connection failures gracefully
  }
  
  async streamTranscript(meetingId, transcriptChunk) {
    // 1. Validate meeting access permissions
    // 2. Process transcript chunk data
    // 3. Broadcast to meeting participants
    // 4. Store transcript chunk for persistence
  }
}
```

### `transcript-service.js`
**Purpose**: Transcript processing and management
- Transcript parsing and normalization
- Speaker identification and attribution
- Transcript chunking and storage
- Transcript search indexing

```javascript
export class TranscriptService {
  async processTranscript(meetingId, transcriptData) {
    // 1. Parse transcript format (VTT, SRT, JSON)
    // 2. Extract speaker information and timestamps
    // 3. Chunk transcript into searchable segments
    // 4. Generate embeddings for semantic search
    // 5. Store processed transcript via DatabaseAgent
    // 6. Index transcript for search functionality
  }
  
  async identifySpeakers(transcriptSegments) {
    // 1. Analyze speech patterns and characteristics
    // 2. Group segments by speaker similarity
    // 3. Assign speaker identifiers
    // 4. Create speaker profiles for meeting
  }
}
```

### `email-service.js`
**Purpose**: Email communication and notifications
- User invitation emails
- Meeting notification emails
- Summary report emails
- System notification emails

```javascript
export class EmailService {
  async sendInvitationEmail(userEmail, invitationData) {
    // 1. Validate email address and invitation data
    // 2. Generate invitation email template
    // 3. Include invitation link and instructions
    // 4. Send email via configured provider
    // 5. Log email delivery status
    // 6. Handle delivery failures with retry
  }
  
  async sendSummaryEmail(userId, summaryData) {
    // 1. Fetch user email preferences
    // 2. Generate summary email template
    // 3. Include summary content and insights
    // 4. Send personalized summary email
  }
}
```

### `meeting-cleanup-service.js`
**Purpose**: Meeting data cleanup and maintenance
- Orphaned meeting cleanup
- Temporary file cleanup
- Meeting data archival
- Performance optimization cleanup

```javascript
export class MeetingCleanupService {
  async cleanupOrphanedMeetings() {
    // 1. Identify meetings without associated users/clients
    // 2. Validate cleanup criteria and age thresholds
    // 3. Archive or delete orphaned meeting data
    // 4. Clean up associated files and embeddings
    // 5. Log cleanup operations for audit
  }
  
  async archiveOldMeetings(retentionPolicy) {
    // 1. Query meetings older than retention period
    // 2. Export meeting data to archive storage
    // 3. Remove from active database
    // 4. Update meeting status to archived
  }
}
```

## Service Integration Patterns

### DatabaseAgent Integration
All services use DatabaseAgent for consistent database operations:

```javascript
export class ServiceBase {
  constructor() {
    this.dbAgent = new DatabaseAgent();
  }
  
  async initializeService() {
    await this.dbAgent.connect();
  }
  
  async performOperation(data) {
    try {
      const result = await this.dbAgent.domainOperations.operation(data);
      return result;
    } catch (error) {
      await this.handleServiceError(error);
      throw error;
    } finally {
      // Connection cleanup handled by DatabaseAgent
    }
  }
}
```

### Event System Integration
Services emit and respond to system events:

```javascript
// Event emission
this.eventEmitter.emit('meeting.created', {
  meetingId: meeting.id,
  userId: meeting.user_id,
  clientId: meeting.client_id,
  metadata: meeting.metadata
});

// Event handling
this.eventEmitter.on('webhook.received', async (webhookData) => {
  await this.processWebhook(webhookData);
});
```

### Service Communication
Services communicate through well-defined interfaces:

```javascript
// Service dependency injection
export class MeetingService {
  constructor(dependencies = {}) {
    this.webhookService = dependencies.webhookService || new WebhookService();
    this.transcriptService = dependencies.transcriptService || new TranscriptService();
    this.emailService = dependencies.emailService || new EmailService();
  }
  
  async createMeetingWithNotification(meetingData, notifyUsers) {
    const meeting = await this.createMeeting(meetingData);
    
    if (notifyUsers) {
      await this.emailService.sendMeetingNotification(
        meeting.participants,
        meeting
      );
    }
    
    return meeting;
  }
}
```

## Error Handling Patterns

### Service-Level Error Handling
```javascript
export class ServiceBase {
  async handleServiceError(error, context = {}) {
    // 1. Log error with service context
    console.error(`Service error in ${this.constructor.name}:`, {
      error: error.message,
      stack: error.stack,
      context: context
    });
    
    // 2. Emit error event for monitoring
    this.eventEmitter.emit('service.error', {
      service: this.constructor.name,
      error: error,
      context: context
    });
    
    // 3. Handle specific error types
    if (error.code === 'DATABASE_CONNECTION_ERROR') {
      await this.handleDatabaseError(error);
    }
    
    // 4. Determine if error is recoverable
    if (this.isRecoverableError(error)) {
      return await this.retryOperation(context);
    }
    
    throw error;
  }
}
```

### Retry Logic
```javascript
async retryWithBackoff(operation, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries || !this.isRetryableError(error)) {
        throw error;
      }
      
      const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
      await this.sleep(delay);
    }
  }
}
```

## Security Patterns

### Service Authentication
Services validate user context and permissions:

```javascript
async validateServiceAccess(userId, clientId, operation) {
  if (!userId || !clientId) {
    throw new Error('Authentication required for service operation');
  }
  
  const hasPermission = await this.dbAgent.clientOperations
    .checkUserAccess(userId, clientId);
    
  if (!hasPermission) {
    throw new Error('Insufficient permissions for service operation');
  }
  
  // Log service access for audit
  await this.logServiceAccess(userId, clientId, operation);
}
```

### Data Validation
Input validation and sanitization in services:

```javascript
validateServiceInput(data, schema) {
  const errors = [];
  
  for (const [key, rules] of Object.entries(schema)) {
    if (rules.required && !data[key]) {
      errors.push(`${key} is required`);
    }
    
    if (data[key] && rules.type && typeof data[key] !== rules.type) {
      errors.push(`${key} must be of type ${rules.type}`);
    }
  }
  
  if (errors.length > 0) {
    throw new ValidationError('Service input validation failed', errors);
  }
}
```

## Performance Patterns

### Service Caching
```javascript
export class CachingService extends ServiceBase {
  constructor() {
    super();
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }
  
  async getCachedOrFetch(key, fetchFunction) {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    
    const data = await fetchFunction();
    this.cache.set(key, {
      data: data,
      timestamp: Date.now()
    });
    
    return data;
  }
}
```

### Batch Processing
```javascript
async processBatch(items, batchSize = 10) {
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(item => this.processItem(item))
    );
    results.push(...batchResults);
  }
  
  return results;
}
```

## Testing Strategies

### Service Unit Testing
- Mock DatabaseAgent dependencies
- Test service methods in isolation
- Validate error handling and recovery
- Test retry logic and backoff strategies

### Service Integration Testing
- Test service-to-service communication
- Validate event emission and handling
- Test external service integrations
- Verify end-to-end workflows

### Service Performance Testing
- Load testing with realistic data volumes
- Concurrent operation testing
- Memory usage and leak detection
- Cache effectiveness validation

## Monitoring and Observability

### Service Metrics
- Operation success/failure rates
- Response time percentiles
- Error frequency and types
- Resource utilization patterns

### Service Logging
- Structured logging with context
- Error tracking and alerting
- Performance metric logging
- Audit trail for sensitive operations

### Service Health Checks
- Service availability monitoring
- Dependency health checking
- Performance threshold monitoring
- Automated service recovery
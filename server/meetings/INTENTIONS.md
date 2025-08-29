# Meeting System

## Purpose
Meeting management system for external meeting integration, bot creation, webhook processing, and meeting data coordination. Handles integration with external meeting platforms like Recall.ai and manages meeting lifecycle from creation to completion.

## Core Meeting Components

### `webhook-chat-helpers.js`
**Purpose**: Webhook processing utilities and chat message handling
- Processes incoming meeting webhooks from external platforms
- Handles chat message normalization and formatting
- Manages webhook authentication and validation
- Provides utilities for webhook data transformation

```javascript
export class WebhookChatHelpers {
  static processIncomingWebhook(webhookData, source) {
    // 1. Validate webhook signature and authenticity
    // 2. Parse webhook payload based on source platform
    // 3. Extract meeting and chat data
    // 4. Normalize data format for internal processing
    // 5. Validate required fields and data integrity
    // 6. Return structured webhook processing result
  }
  
  static normalizeChatMessage(messageData, platform) {
    // 1. Extract message content and metadata
    // 2. Identify speaker information
    // 3. Parse timestamp and formatting
    // 4. Apply platform-specific transformations
    // 5. Return normalized message object
  }
  
  static validateWebhookSource(headers, payload, expectedSource) {
    // 1. Verify webhook signature against known keys
    // 2. Check source platform identification
    // 3. Validate payload structure
    // 4. Return authentication result
  }
  
  static extractMeetingMetadata(webhookData) {
    // 1. Parse meeting identification information
    // 2. Extract meeting status and state changes
    // 3. Get participant information
    // 4. Parse meeting duration and timing
    // 5. Return structured meeting metadata
  }
}
```

### `bot-creation/` Subdirectory

#### `recall-api.js`
**Purpose**: Recall.ai API integration and bot management
- Manages Recall.ai API authentication and communication
- Handles bot creation and configuration requests
- Processes bot status updates and lifecycle management
- Provides error handling and retry logic for API interactions

```javascript
export class RecallAPIClient {
  constructor(apiKey, baseURL) {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
    this.httpClient = this.initializeHTTPClient();
  }
  
  async createMeetingBot(meetingConfig) {
    // 1. Validate meeting configuration data
    // 2. Prepare Recall API request payload
    // 3. Make authenticated API request to create bot
    // 4. Handle API response and extract bot information
    // 5. Process any errors or validation issues
    // 6. Return bot creation result with ID and status
  }
  
  async getBotStatus(botId) {
    // 1. Make API request to get bot status
    // 2. Parse bot status and metadata
    // 3. Handle bot state transitions
    // 4. Return current bot status information
  }
  
  async updateBotConfiguration(botId, config) {
    // 1. Validate configuration updates
    // 2. Prepare API update request
    // 3. Send configuration changes to Recall API
    // 4. Handle update response
    // 5. Return updated bot configuration
  }
  
  async deleteMeetingBot(botId) {
    // 1. Send bot deletion request to API
    // 2. Handle deletion confirmation
    // 3. Clean up local bot references
    // 4. Log bot deletion event
  }
  
  async handleAPIError(error, operation, context) {
    // 1. Parse API error response
    // 2. Determine error type and severity
    // 3. Apply appropriate retry logic
    // 4. Log error with context
    // 5. Return error handling result
  }
}
```

#### `meeting-handler.js`
**Purpose**: Meeting processing and lifecycle management
- Orchestrates meeting creation and processing workflow
- Manages meeting state transitions and updates
- Coordinates between bot creation and meeting storage
- Handles meeting completion and data finalization

```javascript
export class MeetingHandler {
  constructor(dbAgent, recallAPI, webhookService) {
    this.dbAgent = dbAgent;
    this.recallAPI = recallAPI;
    this.webhookService = webhookService;
  }
  
  async createMeetingWithBot(meetingRequest, userContext) {
    // 1. Validate meeting request and user permissions
    // 2. Create bot via Recall API
    // 3. Store meeting record with bot association
    // 4. Set up webhook monitoring for bot
    // 5. Initialize meeting processing pipeline
    // 6. Return meeting creation result with bot info
  }
  
  async processMeetingWebhook(webhookData) {
    // 1. Validate and parse webhook data
    // 2. Identify associated meeting and bot
    // 3. Update meeting status based on webhook
    // 4. Process transcript data if available
    // 5. Handle meeting completion if finished
    // 6. Log webhook processing result
  }
  
  async handleMeetingCompletion(meetingId, completionData) {
    // 1. Validate meeting exists and can be completed
    // 2. Process final transcript and metadata
    // 3. Generate meeting summary if configured
    // 4. Update meeting status to completed
    // 5. Clean up temporary resources
    // 6. Trigger post-processing workflows
  }
  
  async updateMeetingStatus(meetingId, newStatus, metadata = {}) {
    // 1. Validate status transition is allowed
    // 2. Update meeting record via DatabaseAgent
    // 3. Log status change event
    // 4. Notify relevant services of status change
    // 5. Return updated meeting information
  }
  
  async handleMeetingFailure(meetingId, error, context) {
    // 1. Log meeting failure with context
    // 2. Update meeting status to failed
    // 3. Clean up associated resources
    // 4. Notify user of meeting failure
    // 5. Store failure information for analysis
  }
}
```

#### `file-processor.js`
**Purpose**: Meeting file processing and transcript handling
- Processes meeting transcripts and audio files
- Handles file format conversion and validation
- Manages file storage and organization
- Provides transcript parsing and structuring

```javascript
export class MeetingFileProcessor {
  constructor(dbAgent, storageService) {
    this.dbAgent = dbAgent;
    this.storageService = storageService;
  }
  
  async processTranscriptFile(meetingId, transcriptData, format) {
    // 1. Validate transcript data and format
    // 2. Parse transcript based on format (VTT, SRT, JSON)
    // 3. Extract speaker information and timestamps
    // 4. Structure transcript into turns and segments
    // 5. Store processed transcript via DatabaseAgent
    // 6. Generate embeddings for search functionality
    // 7. Return processed transcript information
  }
  
  async processAudioFile(meetingId, audioData, metadata) {
    // 1. Validate audio file and metadata
    // 2. Store audio file in configured storage
    // 3. Extract audio metadata and duration
    // 4. Associate audio with meeting record
    // 5. Schedule audio processing if configured
    // 6. Return audio processing result
  }
  
  async parseTranscriptFormat(transcriptContent, format) {
    // 1. Identify transcript format if not specified
    // 2. Apply format-specific parsing logic
    // 3. Extract timing and speaker information
    // 4. Structure content into conversation turns
    // 5. Validate parsed transcript structure
    // 6. Return structured transcript data
  }
  
  async identifySpeakers(transcriptSegments) {
    // 1. Analyze speaker patterns in transcript
    // 2. Group segments by speaker characteristics
    // 3. Assign consistent speaker identifiers
    // 4. Create speaker profile information
    // 5. Return speaker identification results
  }
  
  async validateTranscriptIntegrity(transcript) {
    // 1. Check transcript completeness
    // 2. Validate timestamp consistency
    // 3. Verify speaker information accuracy
    // 4. Check for missing or corrupted segments
    // 5. Return validation results
  }
}
```

## Meeting Data Models

### Meeting Record Structure
```javascript
{
  id: string, // UUID
  name: string,
  type: 'recall_bot' | 'manual' | 'imported',
  user_id: number,
  client_id: number,
  bot_id: string, // External bot ID
  status: 'creating' | 'in_progress' | 'completed' | 'failed',
  meeting_metadata: {
    platform: 'zoom' | 'teams' | 'meet' | 'other',
    start_time: Date,
    end_time: Date,
    duration: number,
    participant_count: number,
    meeting_url: string
  },
  transcript_metadata: {
    transcript_url: string,
    transcript_format: string,
    processing_status: 'pending' | 'processed' | 'failed',
    word_count: number,
    speaker_count: number
  },
  webhook_data: {
    last_webhook_at: Date,
    webhook_count: number,
    webhook_errors: number
  },
  created_at: Date,
  updated_at: Date
}
```

### Bot Configuration Structure
```javascript
{
  bot_id: string,
  meeting_id: string,
  bot_config: {
    recording_mode: 'audio' | 'video' | 'both',
    transcript_enabled: boolean,
    real_time_transcription: boolean,
    speaker_identification: boolean,
    recording_layout: string
  },
  api_config: {
    webhook_url: string,
    auth_token: string,
    retry_config: object
  },
  status_history: [
    {
      status: string,
      timestamp: Date,
      details: object
    }
  ]
}
```

## Database Integration

### Meeting Operations (via DatabaseAgent)
- `meetingOperations.createMeetingWithBot(meetingData, botConfig)` - Create bot meeting
- `meetingOperations.updateMeetingStatus(meetingId, status)` - Update status
- `meetingOperations.getMeetingByBotId(botId)` - Find meeting by bot
- `meetingOperations.processMeetingCompletion(meetingId, data)` - Complete meeting

### Transcript Operations (via DatabaseAgent)
- `transcriptOperations.storeTranscript(meetingId, transcript)` - Store processed transcript
- `transcriptOperations.updateTranscriptStatus(meetingId, status)` - Update processing status
- `transcriptOperations.getTranscriptChunks(meetingId)` - Get transcript segments

### Webhook Operations (via DatabaseAgent)
- `webhookOperations.logWebhookReceived(meetingId, webhookData)` - Log webhook
- `webhookOperations.getWebhookHistory(meetingId)` - Get webhook history
- `webhookOperations.updateWebhookStatus(webhookId, status)` - Update status

## External API Integration Patterns

### Recall.ai Integration
```javascript
export class RecallIntegrationManager {
  async initiateMeetingRecording(meetingURL, config) {
    // 1. Validate meeting URL and configuration
    // 2. Create bot via Recall API
    // 3. Configure webhook endpoints
    // 4. Start recording session
    // 5. Monitor bot status
    // 6. Return recording session info
  }
  
  async handleRecallWebhook(webhookPayload, signature) {
    // 1. Verify webhook signature
    // 2. Parse Recall webhook data
    // 3. Update meeting status
    // 4. Process transcript data if available
    // 5. Handle recording completion
    // 6. Log webhook processing
  }
}
```

### Webhook Processing Pipeline
```javascript
export class WebhookProcessingPipeline {
  async processIncomingWebhook(source, payload, headers) {
    // 1. Authenticate webhook source
    // 2. Route to appropriate handler
    // 3. Process webhook data
    // 4. Update meeting records
    // 5. Trigger follow-up actions
    // 6. Return processing status
  }
  
  async retryFailedWebhooks(maxRetries = 3) {
    // 1. Query failed webhook records
    // 2. Retry processing with exponential backoff
    // 3. Update retry status
    // 4. Handle permanent failures
    // 5. Log retry attempts
  }
}
```

## Error Handling and Recovery

### Bot Creation Failures
```javascript
export class BotErrorHandler {
  async handleBotCreationFailure(meetingId, error, config) {
    // 1. Log bot creation failure
    // 2. Analyze failure type and cause
    // 3. Determine if retry is appropriate
    // 4. Update meeting status
    // 5. Notify user of failure
    // 6. Clean up partial resources
  }
  
  async retryBotCreation(meetingId, retryConfig) {
    // 1. Load original meeting configuration
    // 2. Apply retry-specific adjustments
    // 3. Attempt bot creation again
    // 4. Handle retry failure
    // 5. Update retry count and status
  }
}
```

### Webhook Error Recovery
```javascript
export class WebhookErrorRecovery {
  async handleWebhookProcessingError(webhookId, error, context) {
    // 1. Classify error type and severity
    // 2. Log error with full context
    // 3. Determine recovery strategy
    // 4. Queue webhook for retry if appropriate
    // 5. Update webhook status
    // 6. Alert monitoring systems
  }
  
  async reconcileMeetingState(meetingId) {
    // 1. Query latest meeting status from external API
    // 2. Compare with internal meeting state
    // 3. Identify discrepancies
    // 4. Update internal state to match
    // 5. Log state reconciliation
  }
}
```

## Security and Authentication

### API Security
```javascript
export class MeetingAPISecurityManager {
  validateAPICredentials(apiKey, source) {
    // 1. Verify API key format and structure
    // 2. Check API key against configured sources
    // 3. Validate key permissions and scope
    // 4. Return authentication result
  }
  
  secureWebhookEndpoint(request, expectedSource) {
    // 1. Verify webhook signature
    // 2. Check request timing and replay protection
    // 3. Validate source IP if configured
    // 4. Return security validation result
  }
}
```

## Performance Optimization

### Concurrent Processing
```javascript
export class MeetingProcessingOptimizer {
  async processBatchWebhooks(webhooks) {
    // 1. Group webhooks by meeting
    // 2. Process in parallel with concurrency limits
    // 3. Handle rate limiting from external APIs
    // 4. Aggregate results
    // 5. Return batch processing summary
  }
  
  async optimizeTranscriptProcessing(transcript) {
    // 1. Chunk transcript for parallel processing
    // 2. Generate embeddings in batches
    // 3. Store results efficiently
    // 4. Monitor processing performance
  }
}
```

## Testing Strategies

### External API Testing
- Mock Recall.ai API responses for unit testing
- Test webhook processing with sample payloads
- Validate error handling for API failures
- Test rate limiting and retry logic

### Integration Testing
- End-to-end meeting creation and completion flow
- Webhook processing pipeline testing
- File processing and transcript handling
- Database state consistency validation

### Security Testing
- Webhook signature validation testing
- API authentication and authorization
- Input validation and sanitization
- Error message security (no information leakage)
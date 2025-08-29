# Meeting Bot Creation System

## Purpose
Specialized components for creating and managing meeting bots through external APIs, processing meeting files and transcripts, and handling the complete bot lifecycle from creation to completion.

## Core Bot Creation Components

### `recall-api.js`
**Purpose**: Direct Recall.ai API integration and bot lifecycle management
- Provides authenticated communication with Recall.ai API
- Manages bot creation, configuration, and deletion operations
- Handles API response processing and error management
- Implements retry logic and rate limiting compliance

```javascript
export class RecallAPIClient {
  constructor(apiKey, baseURL = 'https://api.recall.ai') {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
    this.rateLimiter = new RateLimiter(10, 1000); // 10 requests per second
  }
  
  async createBot(botConfig) {
    // 1. Validate bot configuration parameters
    // 2. Apply rate limiting to API requests
    // 3. Prepare authenticated API request
    // 4. Send bot creation request to Recall API
    // 5. Parse response and extract bot information
    // 6. Handle API errors and validation failures
    // 7. Return bot creation result with ID and status
  }
  
  async getBotStatus(botId) {
    // 1. Make authenticated GET request to bot status endpoint
    // 2. Parse bot status response from API
    // 3. Extract bot state, recording status, and metadata
    // 4. Handle bot state transitions and updates
    // 5. Return current bot status information
  }
  
  async getBotTranscript(botId) {
    // 1. Request transcript data from Recall API
    // 2. Handle different transcript formats (VTT, JSON, etc.)
    // 3. Parse transcript structure and metadata
    // 4. Extract speaker information and timestamps
    // 5. Return structured transcript data
  }
  
  async updateBotSettings(botId, settings) {
    // 1. Validate setting updates against API constraints
    // 2. Prepare PATCH request with setting changes
    // 3. Send update request to Recall API
    // 4. Handle update response and confirmation
    // 5. Return updated bot configuration
  }
  
  async deleteBot(botId) {
    // 1. Send DELETE request to Recall API
    // 2. Handle deletion confirmation response
    // 3. Verify bot is properly terminated
    // 4. Return deletion status confirmation
  }
  
  async handleAPIError(error, operation, retryCount = 0) {
    // 1. Parse Recall API error response structure
    // 2. Identify error type (rate limit, auth, validation, server)
    // 3. Apply appropriate retry strategy based on error type
    // 4. Log error details for monitoring and debugging
    // 5. Return error handling result or rethrow if unrecoverable
  }
  
  buildBotConfiguration(meetingConfig) {
    // 1. Transform internal meeting config to Recall API format
    // 2. Set recording preferences and quality settings
    // 3. Configure webhook endpoints for status updates
    // 4. Set speaker identification and transcription options
    // 5. Return Recall-compatible bot configuration
  }
}
```

### `meeting-handler.js`
**Purpose**: High-level meeting orchestration and bot lifecycle coordination
- Orchestrates the complete meeting bot creation and management process
- Coordinates between API calls, database updates, and user notifications
- Manages meeting state transitions and error recovery
- Provides unified interface for meeting bot operations

```javascript
export class MeetingBotHandler {
  constructor(recallAPI, dbAgent, notificationService) {
    this.recallAPI = recallAPI;
    this.dbAgent = dbAgent;
    this.notificationService = notificationService;
  }
  
  async createMeetingBot(meetingRequest, userContext) {
    // 1. Validate meeting request and user permissions
    // 2. Check client bot creation quotas and limits
    // 3. Prepare bot configuration from meeting parameters
    // 4. Create bot via Recall API with error handling
    // 5. Store meeting record with bot association
    // 6. Set up webhook monitoring and status tracking
    // 7. Initialize meeting processing pipeline
    // 8. Send confirmation notification to user
    // 9. Return meeting creation result with bot information
  }
  
  async handleBotWebhook(webhookData, signature) {
    // 1. Verify webhook signature and authenticity
    // 2. Parse webhook payload and extract bot status
    // 3. Identify associated meeting record
    // 4. Update meeting status based on bot state
    // 5. Process transcript data if bot has completed
    // 6. Handle bot error states and failures
    // 7. Trigger post-processing workflows
    // 8. Log webhook processing results
    // 9. Return webhook handling status
  }
  
  async monitorBotProgress(botId, meetingId) {
    // 1. Periodically check bot status via API
    // 2. Update meeting record with current bot state
    // 3. Handle bot state transitions (joining, recording, processing)
    // 4. Detect and handle bot failures or timeouts
    // 5. Notify users of significant status changes
    // 6. Continue monitoring until bot completion
  }
  
  async handleBotCompletion(botId, meetingId) {
    // 1. Retrieve final bot status and results
    // 2. Download transcript and recording files
    // 3. Process transcript through file processor
    // 4. Update meeting status to completed
    // 5. Generate meeting summary if configured
    // 6. Clean up temporary bot resources
    // 7. Send completion notification to user
    // 8. Archive bot data according to retention policy
  }
  
  async handleBotFailure(botId, meetingId, error) {
    // 1. Log bot failure with detailed error information
    // 2. Determine failure type and potential recovery
    // 3. Update meeting status to failed
    // 4. Clean up associated bot resources
    // 5. Send failure notification to user
    // 6. Store failure data for analysis and improvement
  }
  
  async retryBotOperation(meetingId, operation, config = {}) {
    // 1. Load original meeting configuration
    // 2. Apply retry-specific configuration adjustments
    // 3. Implement exponential backoff for retries
    // 4. Attempt operation with updated configuration
    // 5. Handle retry failure and maximum attempt limits
    // 6. Update retry status and attempt count
  }
}
```

### `file-processor.js`
**Purpose**: Meeting file processing, transcript parsing, and data structuring
- Processes various meeting file formats and transcripts
- Handles file validation, parsing, and format conversion
- Manages transcript structuring and speaker identification
- Provides file storage and organization capabilities

```javascript
export class MeetingFileProcessor {
  constructor(dbAgent, storageService, embeddingService) {
    this.dbAgent = dbAgent;
    this.storageService = storageService;
    this.embeddingService = embeddingService;
  }
  
  async processTranscriptFile(meetingId, transcriptData, metadata = {}) {
    // 1. Detect and validate transcript format (VTT, SRT, JSON, plain text)
    // 2. Parse transcript content using format-specific logic
    // 3. Extract timestamps, speaker information, and content
    // 4. Structure transcript into conversational turns
    // 5. Identify and normalize speaker information
    // 6. Generate embeddings for transcript content
    // 7. Store structured transcript via DatabaseAgent
    // 8. Update meeting record with transcript metadata
    // 9. Return transcript processing results
  }
  
  async processRecordingFile(meetingId, recordingData, metadata = {}) {
    // 1. Validate recording file format and size
    // 2. Store recording file in configured storage system
    // 3. Extract audio/video metadata (duration, quality, format)
    // 4. Generate preview or thumbnail if applicable
    // 5. Associate recording with meeting record
    // 6. Schedule additional processing if configured
    // 7. Return recording processing results
  }
  
  async parseTranscriptFormat(transcriptContent, format) {
    // 1. Apply format-specific parsing logic
    // 2. Handle WebVTT cue parsing and timing
    // 3. Process SRT subtitle format and encoding
    // 4. Parse JSON transcript structure and metadata
    // 5. Extract plain text with basic structure inference
    // 6. Validate parsed content completeness
    // 7. Return structured transcript object
  }
  
  async identifyAndNormalizeSpeakers(transcriptSegments) {
    // 1. Analyze speaker patterns and characteristics
    // 2. Group segments by speaker voice characteristics
    // 3. Assign consistent speaker identifiers
    // 4. Handle speaker overlap and identification conflicts
    // 5. Create speaker profiles with metadata
    // 6. Apply speaker normalization across segments
    // 7. Return speaker identification results
  }
  
  async generateTranscriptEmbeddings(transcriptSegments) {
    // 1. Chunk transcript content for optimal embedding size
    // 2. Generate embeddings for each transcript chunk
    // 3. Associate embeddings with timestamps and speakers
    // 4. Store embeddings via DatabaseAgent for search
    // 5. Handle embedding generation errors gracefully
    // 6. Return embedding generation results
  }
  
  async validateFileIntegrity(fileData, expectedChecksums = {}) {
    // 1. Calculate file checksums (MD5, SHA256)
    // 2. Verify file size and format consistency
    // 3. Check file completeness and corruption
    // 4. Validate against expected checksums if provided
    // 5. Perform format-specific integrity checks
    // 6. Return file integrity validation results
  }
  
  async archiveProcessedFiles(meetingId, retentionPolicy) {
    // 1. Identify files eligible for archival
    // 2. Apply client-specific retention policies
    // 3. Move files to long-term storage
    // 4. Update file references and metadata
    // 5. Clean up temporary processing files
    // 6. Log archival operations for compliance
  }
}
```

## Bot Configuration Models

### Recall Bot Configuration
```javascript
{
  meeting_url: string,
  bot_name: string,
  recording_mode: 'audio' | 'video' | 'both',
  transcription_options: {
    provider: 'deepgram' | 'assembly_ai' | 'whisper',
    language: string,
    speaker_labels: boolean,
    filter_profanity: boolean,
    punctuate: boolean
  },
  recording_options: {
    output_formats: ['mp4', 'mp3', 'wav'],
    video_resolution: '720p' | '1080p',
    audio_quality: 'standard' | 'high'
  },
  webhook_config: {
    url: string,
    events: ['bot_start', 'bot_end', 'transcript_ready'],
    auth_token: string
  },
  metadata: {
    meeting_title: string,
    organizer_email: string,
    expected_duration: number,
    custom_fields: object
  }
}
```

### Bot Status Structure
```javascript
{
  bot_id: string,
  status: 'initializing' | 'joining' | 'recording' | 'processing' | 'completed' | 'failed',
  meeting_metadata: {
    platform: string,
    meeting_id: string,
    start_time: Date,
    end_time: Date,
    duration_ms: number,
    participant_count: number
  },
  recording_metadata: {
    video_url: string,
    audio_url: string,
    transcript_url: string,
    file_sizes: {
      video: number,
      audio: number,
      transcript: number
    }
  },
  processing_status: {
    transcript_ready: boolean,
    recording_ready: boolean,
    processing_errors: [string]
  }
}
```

## Database Integration

### Bot Operations (via DatabaseAgent)
- `botOperations.createBotRecord(meetingId, botConfig)` - Store bot configuration
- `botOperations.updateBotStatus(botId, status, metadata)` - Update bot state
- `botOperations.getBotByMeetingId(meetingId)` - Find bot for meeting
- `botOperations.deleteBotRecord(botId)` - Clean up bot data

### Meeting File Operations (via DatabaseAgent)
- `meetingFileOperations.storeTranscript(meetingId, transcript)` - Store processed transcript
- `meetingFileOperations.storeRecording(meetingId, recordingData)` - Store recording metadata
- `meetingFileOperations.getProcessingStatus(meetingId)` - Get file processing status

### Webhook Tracking (via DatabaseAgent)
- `webhookOperations.logBotWebhook(botId, webhookData)` - Log webhook receipt
- `webhookOperations.updateWebhookProcessing(webhookId, status)` - Update processing
- `webhookOperations.getBotWebhookHistory(botId)` - Get webhook history

## API Integration Patterns

### Rate Limiting and Retry Logic
```javascript
export class APIRateLimiter {
  constructor(requestsPerSecond = 10, burstSize = 20) {
    this.requestsPerSecond = requestsPerSecond;
    this.tokenBucket = burstSize;
    this.lastRefill = Date.now();
  }
  
  async throttleRequest(operation) {
    // 1. Check available tokens in bucket
    // 2. Refill tokens based on time elapsed
    // 3. Wait if no tokens available
    // 4. Execute operation when token available
    // 5. Consume token after successful request
  }
  
  async retryWithBackoff(operation, maxRetries = 3) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries - 1) throw error;
        
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        await this.sleep(delay);
      }
    }
  }
}
```

### Webhook Signature Verification
```javascript
export class WebhookSecurityManager {
  verifyRecallWebhook(payload, signature, secret) {
    // 1. Parse webhook signature header
    // 2. Calculate expected signature using HMAC
    // 3. Compare signatures using constant-time comparison
    // 4. Return verification result
  }
  
  validateWebhookTimestamp(timestamp, tolerance = 300) {
    // 1. Parse webhook timestamp
    // 2. Check against current time with tolerance
    // 3. Prevent replay attacks
    // 4. Return timestamp validation result
  }
}
```

## Error Handling and Recovery

### Bot Creation Error Recovery
```javascript
export class BotErrorRecoveryManager {
  async handleBotCreationFailure(meetingId, error, attempt = 1) {
    // 1. Classify error type (quota, network, configuration, etc.)
    // 2. Determine if error is recoverable
    // 3. Apply appropriate recovery strategy
    // 4. Update meeting status and error information
    // 5. Schedule retry if appropriate
    // 6. Notify user of status and recovery actions
  }
  
  async recoverFromAPIFailure(operation, context, maxRetries = 3) {
    // 1. Analyze API failure type and cause
    // 2. Apply exponential backoff for transient failures
    // 3. Switch to backup API endpoints if available
    // 4. Update API client configuration if needed
    // 5. Log failure and recovery attempts
    // 6. Return recovery result or final failure
  }
}
```

### File Processing Error Handling
```javascript
export class FileProcessingErrorHandler {
  async handleTranscriptProcessingError(meetingId, error, transcriptData) {
    // 1. Log processing error with transcript details
    // 2. Attempt alternative parsing methods
    // 3. Recover partial transcript data if possible
    // 4. Store error information for analysis
    // 5. Update meeting status with processing failure
    // 6. Return partial results or complete failure
  }
  
  async validateAndRepairTranscript(transcript) {
    // 1. Check transcript structure and completeness
    // 2. Identify missing or corrupted segments
    // 3. Apply repair heuristics where possible
    // 4. Mark unrepairable sections
    // 5. Return validated and repaired transcript
  }
}
```

## Performance Optimization

### Concurrent Bot Management
```javascript
export class BotProcessingOptimizer {
  async processConcurrentBots(botOperations, concurrencyLimit = 5) {
    // 1. Group bot operations by priority and type
    // 2. Process operations with controlled concurrency
    // 3. Handle rate limiting across concurrent requests
    // 4. Monitor resource usage and adjust concurrency
    // 5. Return aggregated processing results
  }
  
  async optimizeFileProcessing(files) {
    // 1. Analyze file sizes and processing requirements
    // 2. Schedule processing based on resource availability
    // 3. Process files in parallel where possible
    // 4. Monitor memory usage and adjust batch sizes
    // 5. Return optimized processing results
  }
}
```

### Caching and Memoization
```javascript
export class BotOperationCache {
  constructor(ttl = 300000) { // 5 minutes
    this.statusCache = new Map();
    this.configCache = new Map();
    this.ttl = ttl;
  }
  
  async getCachedBotStatus(botId) {
    // 1. Check cache for bot status
    // 2. Return cached status if valid
    // 3. Fetch fresh status if cache miss/expired
    // 4. Update cache with fresh data
    // 5. Return current bot status
  }
  
  invalidateBotCache(botId) {
    // 1. Remove bot-specific cache entries
    // 2. Clear related meeting cache data
    // 3. Log cache invalidation
  }
}
```

## Security Considerations

### API Security
- Secure storage and rotation of API keys
- Request signature validation
- Rate limiting and abuse prevention
- Audit logging of all API operations
- Secure handling of meeting URLs and credentials

### Data Security
- Encryption of stored transcript data
- Secure file transfer and storage
- Access control for meeting recordings
- Privacy compliance for recorded content
- Secure deletion of expired data

## Testing Strategies

### Unit Testing
- Mock Recall API for consistent testing
- Test transcript parsing with various formats
- Validate error handling scenarios
- Test webhook processing logic

### Integration Testing
- End-to-end bot creation and completion flow
- Real API integration testing (with test accounts)
- File processing pipeline testing
- Webhook delivery and processing testing

### Performance Testing
- Concurrent bot creation load testing
- Large file processing performance
- API rate limiting compliance
- Memory usage optimization validation

### Security Testing
- Webhook signature validation testing
- API authentication security testing
- File upload security validation
- Data encryption and access control testing
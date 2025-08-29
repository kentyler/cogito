# Event System

## Purpose
Event logging, tracking, and notification system for system monitoring, user invitations, and audit trails. Provides centralized event management with database persistence and email notifications.

## Core Event Components

### `event-logger.js`
**Purpose**: Centralized event logging and audit trail management
- Logs system events, errors, and user actions to database
- Provides structured logging with context and metadata
- Handles event categorization and severity levels
- Supports event querying and analysis

```javascript
export class EventLogger {
  constructor(dbPool) {
    this.dbPool = dbPool;
    this.dbAgent = new DatabaseAgent();
  }
  
  async logEvent(eventType, eventData, context = {}) {
    // 1. Structure event data with timestamp and context
    // 2. Determine event severity and category
    // 3. Store event in database via DatabaseAgent
    // 4. Emit event for real-time monitoring if needed
    // 5. Handle logging errors gracefully
    // 6. Return event ID for reference
  }
  
  async logError(errorType, error, context = {}) {
    // 1. Extract error details and stack trace
    // 2. Include request context and user information
    // 3. Categorize error severity (critical, warning, info)
    // 4. Store structured error event
    // 5. Trigger alerts for critical errors
    // 6. Return error event ID
  }
  
  async logUserAction(action, userId, metadata = {}) {
    // 1. Structure user action with timestamp
    // 2. Include user and client context
    // 3. Add action-specific metadata
    // 4. Store action for audit trail
    // 5. Support compliance and security tracking
  }
}

export function extractRequestContext(req) {
  // 1. Extract relevant request information
  // 2. Include user and session context
  // 3. Add IP address and user agent
  // 4. Include request timing and method
  // 5. Return structured context object
}
```

### `invitation-service.js`
**Purpose**: User invitation management and processing
- Handles user invitation creation and tracking
- Manages invitation validation and expiration
- Coordinates with email service for invitation delivery
- Tracks invitation acceptance and user onboarding

```javascript
export class InvitationService {
  constructor(dbAgent, emailService) {
    this.dbAgent = dbAgent;
    this.emailService = emailService;
  }
  
  async createInvitation(inviterUserId, inviteeEmail, clientId, options = {}) {
    // 1. Validate inviter permissions and client access
    // 2. Check if invitee already exists or has pending invitation
    // 3. Generate secure invitation token
    // 4. Create invitation record via DatabaseAgent
    // 5. Send invitation email via email service
    // 6. Log invitation creation event
    // 7. Return invitation details and status
  }
  
  async processInvitationAcceptance(invitationToken, userData) {
    // 1. Validate invitation token and expiration
    // 2. Check invitation hasn't been used
    // 3. Create user account with invitation context
    // 4. Grant client access based on invitation
    // 5. Mark invitation as accepted
    // 6. Send welcome email to new user
    // 7. Log successful invitation acceptance
  }
  
  async validateInvitation(token) {
    // 1. Lookup invitation by token via DatabaseAgent
    // 2. Check invitation is valid and not expired
    // 3. Verify invitation hasn't been used
    // 4. Return invitation details or validation error
  }
  
  async getInvitationsByClient(clientId) {
    // 1. Fetch all invitations for client via DatabaseAgent
    // 2. Include invitation status and metadata
    // 3. Filter by permission levels if needed
    // 4. Return formatted invitation list
  }
}
```

### `invitation-email.js`
**Purpose**: Email template management and invitation email delivery
- Manages email templates for different invitation types
- Handles email personalization and formatting
- Coordinates with email service providers
- Tracks email delivery status and failures

```javascript
export class InvitationEmailService {
  constructor(emailProvider, templateEngine) {
    this.emailProvider = emailProvider;
    this.templateEngine = templateEngine;
  }
  
  async sendInvitationEmail(invitation, inviterInfo) {
    // 1. Load appropriate email template
    // 2. Personalize template with invitation and inviter data
    // 3. Generate secure invitation link
    // 4. Send email via configured provider
    // 5. Log email delivery attempt
    // 6. Handle delivery failures with retry logic
    // 7. Return delivery status
  }
  
  async sendWelcomeEmail(newUser, clientInfo) {
    // 1. Load welcome email template
    // 2. Personalize with user and client information
    // 3. Include getting started information
    // 4. Send welcome email
    // 5. Log welcome email delivery
  }
  
  buildInvitationLink(invitationToken, clientId) {
    // 1. Get base application URL from configuration
    // 2. Build secure invitation URL with token
    // 3. Include client context for proper routing
    // 4. Add tracking parameters if needed
    // 5. Return complete invitation URL
  }
  
  async getEmailTemplate(templateType, context) {
    // 1. Load template file or content
    // 2. Apply context data to template
    // 3. Handle template variables and formatting
    // 4. Return rendered email content
  }
}
```

## Event Data Models

### Event Structure
```javascript
{
  id: number,
  event_type: string,
  severity: 'info' | 'warning' | 'error' | 'critical',
  user_id: number,
  client_id: number,
  event_data: {
    // Event-specific data
    action: string,
    details: object,
    metadata: object
  },
  context: {
    request_id: string,
    ip_address: string,
    user_agent: string,
    session_id: string,
    timestamp: Date
  },
  created_at: Date
}
```

### Invitation Structure
```javascript
{
  id: number,
  token: string, // Secure UUID token
  inviter_user_id: number,
  invitee_email: string,
  client_id: number,
  status: 'pending' | 'accepted' | 'expired' | 'revoked',
  invitation_type: 'user_invitation' | 'admin_invitation',
  metadata: {
    permissions: [string],
    custom_message: string,
    expires_at: Date
  },
  created_at: Date,
  accepted_at: Date,
  accepted_by_user_id: number
}
```

## Database Integration

### Event Operations (via DatabaseAgent)
- `eventOperations.createEvent(eventData)` - Store system event
- `eventOperations.getEventsByUser(userId, filters)` - Get user's events
- `eventOperations.getEventsByType(eventType, dateRange)` - Get events by type
- `eventOperations.getEventStatistics(filters)` - Event analytics

### Invitation Operations (via DatabaseAgent)
- `invitationOperations.createInvitation(invitationData)` - Create invitation
- `invitationOperations.getInvitationByToken(token)` - Lookup by token
- `invitationOperations.updateInvitationStatus(id, status)` - Update status
- `invitationOperations.getClientInvitations(clientId)` - Get client invitations

### User Operations (via DatabaseAgent)
- `userOperations.createUserFromInvitation(userData, invitationId)` - Create user
- `userOperations.grantClientAccess(userId, clientId, permissions)` - Grant access

## Event Types and Categories

### System Events
- `system_startup` - Application startup
- `system_shutdown` - Application shutdown
- `database_connection` - Database connectivity events
- `provider_health` - External provider health checks

### User Events
- `user_login` - User authentication
- `user_logout` - User session termination
- `client_selection` - Client context changes
- `conversation_started` - New conversation initiation

### Error Events
- `authentication_error` - Authentication failures
- `permission_denied` - Access control violations
- `database_error` - Database operation failures
- `external_api_error` - External service failures

### Invitation Events
- `invitation_sent` - Invitation email sent
- `invitation_accepted` - Invitation accepted
- `invitation_expired` - Invitation expired
- `user_onboarded` - New user completed onboarding

## Email Integration Patterns

### Template System
```javascript
export class EmailTemplateManager {
  constructor() {
    this.templates = new Map();
    this.loadTemplates();
  }
  
  async renderTemplate(templateName, context) {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Email template '${templateName}' not found`);
    }
    
    return this.templateEngine.render(template, context);
  }
  
  loadTemplates() {
    this.templates.set('invitation', {
      subject: 'You\'re invited to join {{clientName}} on Cogito',
      html: this.loadTemplateFile('invitation.html'),
      text: this.loadTemplateFile('invitation.txt')
    });
    
    this.templates.set('welcome', {
      subject: 'Welcome to {{clientName}} on Cogito!',
      html: this.loadTemplateFile('welcome.html'),
      text: this.loadTemplateFile('welcome.txt')
    });
  }
}
```

### Email Delivery Pipeline
```javascript
export class EmailDeliveryPipeline {
  async processEmailQueue() {
    // 1. Fetch pending emails from queue
    // 2. Process emails in batches
    // 3. Handle delivery attempts with retry logic
    // 4. Update delivery status in database
    // 5. Handle permanent failures
    // 6. Log delivery metrics
  }
  
  async deliverEmail(emailData) {
    try {
      const result = await this.emailProvider.send(emailData);
      await this.logDeliverySuccess(emailData.id, result);
      return result;
    } catch (error) {
      await this.handleDeliveryError(emailData, error);
      throw error;
    }
  }
}
```

## Security and Privacy

### Invitation Security
```javascript
export class InvitationSecurityManager {
  generateSecureToken() {
    // 1. Generate cryptographically secure random token
    // 2. Ensure token uniqueness in database
    // 3. Set appropriate token length for security
    // 4. Return secure invitation token
    return crypto.randomUUID();
  }
  
  validateInvitationPermissions(inviterUserId, clientId, inviteeEmail) {
    // 1. Verify inviter has permission to invite users
    // 2. Check client invitation policies
    // 3. Validate invitee email domain restrictions
    // 4. Ensure invitation limits are not exceeded
  }
  
  sanitizeInvitationData(invitationData) {
    // 1. Remove sensitive information from invitation
    // 2. Sanitize user input fields
    // 3. Validate email addresses
    // 4. Return sanitized invitation data
  }
}
```

### Event Data Privacy
```javascript
export class EventPrivacyManager {
  sanitizeEventData(eventData, eventType) {
    // 1. Remove sensitive information based on event type
    // 2. Hash or encrypt PII if needed for analytics
    // 3. Apply data retention policies
    // 4. Return privacy-compliant event data
  }
  
  maskSensitiveData(data) {
    // 1. Identify sensitive fields (emails, IDs, etc.)
    // 2. Apply appropriate masking or redaction
    // 3. Preserve data utility for analytics
    // 4. Return masked data
  }
}
```

## Monitoring and Analytics

### Event Analytics
```javascript
export class EventAnalytics {
  async getEventMetrics(dateRange, filters = {}) {
    // 1. Query events within date range via DatabaseAgent
    // 2. Apply filters for event types, users, clients
    // 3. Calculate metrics (counts, rates, patterns)
    // 4. Aggregate data for reporting
    // 5. Return analytics summary
  }
  
  async getUserActivityMetrics(userId, period) {
    // 1. Get user events for specified period
    // 2. Calculate activity patterns and frequency
    // 3. Identify peak usage times
    // 4. Return user activity insights
  }
  
  async getSystemHealthMetrics() {
    // 1. Query error events and system events
    // 2. Calculate error rates and system uptime
    // 3. Identify performance trends
    // 4. Return system health dashboard data
  }
}
```

### Invitation Analytics
```javascript
export class InvitationAnalytics {
  async getInvitationConversionRates(clientId, period) {
    // 1. Get invitations sent vs accepted for period
    // 2. Calculate conversion rates by invitation type
    // 3. Analyze time-to-acceptance patterns
    // 4. Return invitation effectiveness metrics
  }
  
  async getOnboardingMetrics(clientId) {
    // 1. Track user journey from invitation to active usage
    // 2. Identify onboarding completion rates
    // 3. Calculate time-to-first-value metrics
    // 4. Return onboarding success analytics
  }
}
```

## Testing Strategies

### Event System Testing
- Unit tests for event logging with mock database
- Integration tests for event flow and database storage
- Test event data sanitization and privacy compliance
- Validate event querying and analytics accuracy

### Invitation System Testing
- Test invitation creation and validation flows
- Mock email service for invitation delivery testing
- Test invitation security (token generation, expiration)
- Validate invitation acceptance and user creation
- Test edge cases (duplicate invitations, expired tokens)

### Email Integration Testing
- Mock email providers for testing
- Test template rendering with various data
- Validate email delivery error handling
- Test email queue processing and retry logic
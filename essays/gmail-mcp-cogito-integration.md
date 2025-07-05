# Gmail MCP Server Integration with Cogito: Architecture and Workflow

## Overview

The cogito system employs a dual-MCP server architecture for email intelligence, combining a dedicated Gmail MCP server with the main cogito MCP server to create a comprehensive communication and personality analysis platform.

## Architecture Components

### 1. Gmail MCP Server (`/home/ken/claude-projects/gmail-mcp/`)

**Purpose**: Dedicated Gmail API interface providing email operations
**Technology**: Node.js with Google APIs client library
**Authentication**: OAuth 2.0 with refresh token management

**Available Tools**:
- `gmail_check_auth` - Authorization status and setup
- `gmail_list_emails` - Query and retrieve email lists (supports Gmail search syntax)
- `gmail_read_email` - Full email content retrieval by ID
- `gmail_compose_email` - Email composition and sending (supports replies)

**Key Features**:
- Automatic token refresh for continuous operation
- Gmail search query support (e.g., "from:karl@cognitiveload.net")
- Thread-aware reply functionality
- Secure credential management with `credentials.json` and `token.json`

### 2. Cogito MCP Server (`/home/ken/claude-projects/cogito/`)

**Purpose**: Multi-personality coordination, identity tracking, and communication intelligence
**Technology**: Node.js with PostgreSQL database
**Database**: `cogito` (consolidated from previous `cogito_multi`)

**Email-Related Database Schema**:
```sql
-- Core identity tracking
identities (id, email, display_name, first_seen, last_seen, metadata)

-- All interactions including emails
interactions (id, identity_id, type, occurred_at, content, metadata)

-- Email-specific metadata
email_details (interaction_id, message_id, subject, from_email, to_emails, thread_id)

-- AI analysis of communication patterns
analysis_snapshots (identity_id, communication_style, interests, personality_notes)
```

## Integration Challenges Identified

### 1. **MCP-to-MCP Communication Gap**

Currently, there's no direct communication bridge between the Gmail MCP server and cogito MCP server. Each runs independently:

- **Gmail MCP**: Responds to tool calls from Claude Code sessions
- **Cogito MCP**: Provides personality coordination and database operations

**Missing Link**: No automated workflow to:
- Fetch emails from Gmail MCP into cogito database
- Trigger personality analysis on new emails
- Coordinate between the two systems

### 2. **Data Transformation Pipeline**

The Gmail API format doesn't directly map to cogito's identity-centric database:

**Gmail Format**:
```json
{
  "id": "message_id",
  "payload": {
    "headers": [{"name": "From", "value": "user@domain.com"}],
    "body": {"data": "base64_encoded_content"}
  }
}
```

**Cogito Format** (needs transformation):
```sql
INSERT INTO identities (email, display_name, metadata)
INSERT INTO interactions (identity_id, type, content, metadata)
INSERT INTO email_details (message_id, subject, from_email)
```

### 3. **Project Context Integration**

With the new project isolation system (project_id columns), emails need to be associated with specific projects. Current challenges:

- **Project Detection**: How to determine which project an email relates to
- **Cross-Project Identities**: Same person across multiple projects
- **Context Inheritance**: Previous conversation context across projects

## Proposed Integration Workflow

### Phase 1: Manual Email Processing

1. **Fetch Emails**: Use Gmail MCP tools to list and read recent emails
2. **Parse and Transform**: Extract identity and content information
3. **Database Insert**: Manually populate cogito database with proper project_id
4. **Personality Analysis**: Trigger cogito analysis for each sender

### Phase 2: Automated Bridge Development

Create a bridge service that:

```javascript
// Pseudo-code for email bridge
class EmailCogitoBridge {
  async syncEmails() {
    // 1. Call Gmail MCP to list recent emails
    const emails = await gmailMCP.call('gmail_list_emails', {maxResults: 50});
    
    // 2. Transform and store in cogito database
    for (const email of emails) {
      const identity = await this.findOrCreateIdentity(email.from);
      const projectId = await this.detectProject(email);
      await this.storeInteraction(identity, email, projectId);
    }
    
    // 3. Trigger personality analysis
    await this.analyzeNewInteractions();
  }
}
```

### Phase 3: Real-Time Integration

- **Webhook Integration**: Gmail push notifications for new emails
- **Automatic Processing**: Real-time email ingestion and analysis
- **Smart Project Detection**: AI-powered project context recognition
- **Response Coordination**: Multi-personality email response generation

## Immediate Action Items

To address the current need to respond to Karl, Linden, and Julian:

1. **Manual Email Fetching**: Use Gmail MCP tools to retrieve their emails
2. **Identity Creation**: Manually create identity records for each sender
3. **Communication Analysis**: Analyze their writing style and preferences
4. **Response Generation**: Use cogito personalities to craft appropriate replies

## Technical Implementation Notes

### Database Project Association

New emails should be tagged with project context:

```sql
-- Example for associating emails with cogito project
UPDATE interactions 
SET metadata = jsonb_set(metadata, '{project_id}', '4')
WHERE type = 'email_received';
```

### Gmail Search Optimization

Use Gmail search syntax for efficient email retrieval:

```javascript
// Search for specific senders
await gmailMCP.call('gmail_list_emails', {
  query: 'from:karl@cognitiveload.net OR from:linden@example.com OR from:julianandrewsnz@gmail.com'
});
```

### Cross-System Authentication

Both systems need proper authentication:
- **Gmail MCP**: OAuth 2.0 tokens for Gmail API access
- **Cogito MCP**: PostgreSQL database credentials

## Conclusion

The Gmail-Cogito integration represents a sophisticated approach to email-driven personality analysis and intelligent communication. While the current architecture provides strong foundations, implementing the integration bridge will unlock the full potential of AI-powered email interaction management.

The immediate priority is establishing the manual workflow to respond to current emails, followed by building automated integration for seamless future email processing.

---

*Generated during cogito development session on 2025-06-17*
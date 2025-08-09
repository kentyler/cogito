# server/services/email-service.js - Query Catalog

## File Summary
- **Purpose**: Meeting transcript email delivery service
- **Query Count**: 1 query
- **Main Operations**: Send transcript emails and mark as sent

## Query Analysis

### Query 1: Mark Email as Sent (Line 113)
```javascript
await this.pool.query(`
  UPDATE meetings 
  SET email_sent = TRUE 
  WHERE id = $1
`, [meetingId]);
```
**Context**: `sendTranscriptEmail` method  
**Purpose**: Mark meeting as having transcript email sent to prevent duplicates  
**Parameters**: `meetingId`  
**Returns**: Update confirmation  
**Note**: **BUG IDENTIFIED** - Uses `meetings` instead of `meetings.meetings`

## Proposed DatabaseAgent Methods

```javascript
// Email tracking operations
async markEmailSent(meetingId)
```

## Domain Classification
- **Primary**: Email Service
- **Secondary**: Meeting Status Updates
- **Pattern**: Status flag updates after external operations

## Notes
- **BUG IDENTIFIED**: Query uses `meetings` table instead of `meetings.meetings`
- Comprehensive transcript formatting with speaker consolidation
- HTML email generation with meeting metadata
- Handles multiple email providers (Resend, Gmail)
- Prevents duplicate email sending with `email_sent` flag
- Rich transcript cleaning and speaker grouping logic
- Error handling for connection issues (common in dev/test)
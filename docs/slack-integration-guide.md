# Slack Integration Guide for Cogito

This guide explains how to set up Slack integration with the Cogito MCP server, enabling Claude to read and respond to Slack messages.

## Overview

The Slack integration consists of two components:
1. **Slack MCP Server** (`/slack-mcp/`) - Handles Slack API communication
2. **Cogito Integration** - Provides MCP tools for Claude to interact with Slack

## Setup Instructions

### 1. Create a Slack App

1. Go to https://api.slack.com/apps
2. Click "Create New App" > "From scratch"
3. Name your app (e.g., "Claude Assistant")
4. Select your workspace

### 2. Configure OAuth Permissions

In your app settings:

1. Navigate to "OAuth & Permissions"
2. Add the following Bot Token Scopes:
   - `channels:history` - View messages in public channels
   - `channels:read` - View basic channel info
   - `chat:write` - Send messages
   - `groups:history` - View messages in private channels
   - `groups:read` - View basic private channel info
   - `im:history` - View direct messages
   - `im:read` - View basic DM info
   - `mpim:history` - View group DMs
   - `mpim:read` - View basic group DM info
   - `users:read` - View user information
   - `search:read` - Search messages

### 3. Install App to Workspace

1. In "OAuth & Permissions", click "Install to Workspace"
2. Authorize the requested permissions
3. Copy the "Bot User OAuth Token" (starts with `xoxb-`)
4. Save this token - you'll need it for configuration

### 4. Configure Slack MCP

Create a `token.json` file in the `/slack-mcp/` directory:

```json
{
  "access_token": "xoxb-your-bot-token-here"
}
```

**Important**: Never commit this file to version control!

### 5. Test Slack Integration

You can now use the Slack tools through Cogito:

```bash
# Check authentication
mcp__cogito__slack_check_auth

# List channels
mcp__cogito__slack_list_channels

# Read messages from a channel
mcp__cogito__slack_list_messages { "channel": "#general" }

# Send a message
mcp__cogito__slack_send_message { "channel": "#general", "text": "Hello from Claude!" }
```

## Available Slack Tools

### slack_check_auth
Verify Slack authentication and connection status.

### slack_list_channels
List all channels the bot has access to.
- Shows which channels the bot is a member of
- Includes public and private channels

### slack_list_messages
Read recent messages from a specific channel.
- Parameters:
  - `channel`: Channel ID or name (e.g., "#general" or "C1234567890")
  - `limit`: Number of messages to retrieve (default: 10)

### slack_send_message
Send a message to a channel or thread.
- Parameters:
  - `channel`: Channel ID or name
  - `text`: Message content
  - `thread_ts`: Optional thread timestamp for replies

## Using with Personalities

The Slack integration works seamlessly with Cogito's personality system:

1. Messages are automatically tracked in the identity system
2. Personalities can engage in natural conversations
3. Context is maintained across interactions

## Troubleshooting

### Bot Not in Channel
If you get a "not_in_channel" error:
1. Invite the bot to the channel: `/invite @YourBotName`
2. For private channels, the bot must be explicitly invited

### Authentication Issues
If authentication fails:
1. Verify the token in `token.json` is correct
2. Check that all required scopes are added
3. Try reinstalling the app to your workspace

### Rate Limits
Slack has API rate limits. The integration respects these automatically, but be aware:
- Web API: ~1 request per second
- Search API: More restrictive limits

## Security Best Practices

1. **Token Security**:
   - Never share your bot token
   - Use environment variables in production
   - Rotate tokens regularly

2. **Channel Access**:
   - Only invite the bot to necessary channels
   - Review bot permissions periodically
   - Monitor bot activity

3. **Message Content**:
   - Be aware that the bot can read all messages in joined channels
   - Implement appropriate content filtering if needed

## Integration with Email Responder

The Slack integration can work alongside the email responder for unified communication:

```javascript
// Example: Notify Slack when responding to important emails
await handleSlackSendMessage({
  channel: "#email-responses",
  text: `Responded to email from ${sender}: "${subject}"`
});
```

## Next Steps

1. Test the integration with a few channels
2. Set up monitoring for bot activity
3. Consider implementing custom slash commands
4. Explore Socket Mode for real-time events (future enhancement)
# Deprecated Components

This folder contains components that have been superseded by newer implementations but are kept for historical reference.

## recall-bot/

**Deprecated on:** July 2024  
**Replaced by:** conversational-repl/server.js

The recall-bot was the original implementation of the Recall.ai meeting bot integration. Its functionality has been merged into the main conversational-repl server, which now handles:

- Meeting bot creation
- Real-time transcription via WebSocket
- Voice cue detection for natural transcript chunking
- Chat interaction with Claude
- Email transcript delivery

### Key files preserved for reference:
- `OUR_STORY.md` - Development history and architectural decisions
- `thinking-tools.js` - Original thinking tools implementation
- `simple-mail-server.js` - Email service implementation
- `server.js` - Original server with voice cue detection

### Migration notes:
- All database tables remain the same
- WebSocket endpoint moved to conversational-repl server
- Bot creation API integrated into main app
- Voice cue detection preserved and enhanced
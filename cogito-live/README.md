# Cogito Live Meeting Companion

Browser-based real-time meeting intelligence with Cogito pattern analysis.

## Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm start

# Open browser to http://localhost:3000
```

## Current Features

- ✅ WebSocket connection to server
- ✅ Browser audio capture with level monitoring
- ✅ Real-time transcript display
- ✅ Split-screen interface (transcript + insights)
- ⏳ Audio transcription (simulated)
- ⏳ Cogito pattern analysis
- ⏳ Text-to-speech responses

## Architecture

- **Frontend**: Vanilla JavaScript with WebSocket client
- **Backend**: Node.js Express server with WebSocket support
- **Audio**: MediaRecorder API for browser audio capture
- **Future**: Whisper API integration, Cogito analysis pipeline

## Development Status

This is step 1 of building a smooth live meeting system. Currently implemented:
- Basic UI with split-screen layout
- WebSocket connection and audio capture
- Simulated transcription responses

Next steps:
- Real transcription service integration
- Cogito pattern analysis integration
- Text-to-speech for insights
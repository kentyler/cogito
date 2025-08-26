# Golden Horde Collective Application

**Purpose**: Standalone web interface for public interaction with the Golden Horde Collective avatar. Provides a focused, curated experience for the Golden Horde persona with prompt templates, conversation management, and seamless integration with the main Cogito system.

**Token Optimization**: 🎯 **~1,200 tokens** (inherently efficient due to focused scope and clean architecture)

---

## Core Architectural Principles

### Standalone Application Design
- **Independent operation**: Runs on separate port (3001) from main Cogito system
- **Single avatar focus**: Dedicated to Golden Horde Collective persona only
- **Clean integration**: Communicates with main Cogito via HTTP API
- **Public interface**: Designed for external users without system complexity

### File Size Excellence
- **Perfect compliance**: All files under 200-line limit
- **Largest file**: 101 lines (goldenhorde-api.js)
- **Well-sized modules**: Most files 25-85 lines, optimal for maintenance
- **Focused responsibilities**: Each module handles single, clear purpose

### Modern Web Standards
- **ES6 modules**: Consistent import/export patterns throughout
- **Express.js architecture**: Clean route separation and middleware
- **Responsive design**: Tailwind CSS with custom styling
- **Session management**: Secure authentication with express-session

---

## Application Structure

### 🚀 **server.js** (85 lines) - Main Application Entry
**Purpose**: Express server configuration and routing orchestration

- **Port configuration**: Runs on port 3001 (configurable via env)
- **Session management**: 24-hour sessions with secure configuration
- **Authentication middleware**: Simple requireAuth for protected routes
- **Static file serving**: Public assets and HTML delivery
- **Health checks**: System monitoring endpoint

**Pattern**: Clean Express app with middleware separation and clear route delegation

### 🔐 **routes/** - Server Route Handlers
**Purpose**: Backend API endpoints for authentication and chat functionality

#### **auth.js** (73 lines) - Authentication Management
- **Simple auth flow**: Username/password validation
- **Session creation**: User session establishment
- **Logout handling**: Session cleanup
- **Demo credentials**: Hardcoded for prototype (username: goldenhorde)

#### **chat.js** (84 lines) - Chat API Integration
- **Message processing**: Receives user messages and forwards to main Cogito
- **CogitoClient integration**: Uses lib/cogito-client.js for API calls
- **Error handling**: Graceful fallbacks and user-friendly responses
- **Session validation**: Ensures authenticated access

**Pattern**: RESTful API design with clear separation of concerns

### 📚 **lib/cogito-client.js** (74 lines) - Cogito API Integration
**Purpose**: HTTP client for communicating with main Cogito system

- **API abstraction**: Clean interface for Cogito server communication
- **Golden Horde targeting**: Forces specific avatar and client selection
- **Error handling**: Comprehensive fallbacks when main system unavailable
- **Health monitoring**: Connection status checking

**Key Features**:
- Hardcoded Golden Horde avatar selection
- Client ID 9 targeting (Golden Horde client)
- Graceful degradation with fallback responses
- Metadata preservation for debugging

### 🎨 **public/** - Frontend Assets
**Purpose**: Complete web interface with modular JavaScript architecture

#### **HTML Structure**
- **index.html**: Main chat interface with prompt library sidebar
- **login.html**: Authentication form with Golden Horde branding

#### **CSS Styling**
- **goldenhorde.css** (129 lines): Custom styling for Golden Horde theme
- **Tailwind integration**: Utility-first CSS framework
- **Responsive design**: Mobile-friendly interface
- **Custom animations**: Typing indicators and smooth transitions

#### **JavaScript Modules** (Modular Frontend Architecture)

**🔧 goldenhorde-main.js** (25 lines) - Application Initialization
- **DOM setup**: Event listeners and initialization
- **Module coordination**: Brings together auth, conversation, and API modules
- **State management**: Application-level state coordination

**🔐 goldenhorde-auth.js** (94 lines) - Frontend Authentication
- **Login form handling**: User credential submission
- **Session management**: Frontend session state tracking
- **Authentication flow**: Coordinates with backend auth routes
- **User feedback**: Success/error message display

**💬 goldenhorde-conversation.js** (75 lines) - Chat Interface Management
- **Message display**: Conversation rendering and management
- **User interaction**: Message input handling and validation
- **UI updates**: Dynamic conversation updates and scrolling
- **Character counting**: Input length tracking and limits

**🌐 goldenhorde-api.js** (101 lines) - API Communication
- **Message sending**: User message transmission to backend
- **Response handling**: Assistant response processing and display
- **Typing indicators**: Visual feedback during processing
- **Error management**: User-friendly error display
- **Demo simulation**: Fallback responses for development

**📋 goldenhorde-prompts.js** (83 lines) - Prompt Template System
- **Template library**: Curated prompt templates for Golden Horde
- **Category organization**: Prompts organized by functional areas
- **Search functionality**: Template filtering and discovery
- **Template application**: One-click prompt insertion

**🔗 goldenhorde-events.js** (44 lines) - Event Management
- **Event delegation**: Centralized event handling
- **Keyboard shortcuts**: Enhanced user interaction (Enter to send)
- **State synchronization**: Cross-module event coordination

**🔓 auth.js** (61 lines) - Authentication Utilities
- **Helper functions**: Authentication state management utilities
- **Session validation**: Frontend session checking
- **Redirect handling**: Post-authentication navigation

**Pattern**: Domain-separated modules with clear interfaces and single responsibilities

---

## Key Design Decisions

### Golden Horde Persona Focus
- **Dedicated experience**: Entire application optimized for single avatar
- **Curated prompts**: Template library specific to Golden Horde capabilities
- **Themed interface**: Visual design reflects nomadic collective identity
- **Hardcoded targeting**: API calls always route to Golden Horde avatar

### Integration Architecture
- **Loose coupling**: Communicates with main Cogito via HTTP API
- **Independent deployment**: Can run separately from main system
- **Graceful degradation**: Works even if main Cogito is unavailable
- **Session isolation**: Independent authentication system

### User Experience Optimization
- **Prompt library**: Sidebar with categorized templates for easy discovery
- **Real-time feedback**: Typing indicators and status messages
- **Responsive design**: Works across desktop and mobile devices
- **Character limits**: Input validation and guidance

---

## Development Patterns

### API Communication Pattern
```javascript
// Clean API abstraction with error handling
const client = new CogitoClient('http://localhost:3000');
const result = await client.sendMessage(message, { email: userEmail });

if (result.success) {
  displayResponse(result.response);
} else {
  showFallbackResponse(result.response);
}
```

### Frontend Module Pattern
```javascript
// Domain-specific modules with global exposure
function sendMessage() {
  // Implementation
}

// Make available globally for cross-module communication
window.sendMessage = sendMessage;
```

### Route Handler Pattern
```javascript
// Express routes with CogitoClient integration
app.post('/api/chat', async (req, res) => {
  const client = new CogitoClient();
  const result = await client.sendMessage(req.body.message, req.session.user);
  res.json(result);
});
```

---

## Technical Specifications

### Dependencies
**Production**:
- `express` ^4.18.2 - Web server framework
- `express-session` ^1.17.3 - Session management

**Development**:
- `nodemon` ^3.0.1 - Development auto-reload

### Configuration
- **Port**: 3001 (configurable via GOLDEN_HORDE_PORT)
- **Session**: 24-hour sessions with secure configuration
- **Static assets**: Served from public/ directory
- **Integration**: Main Cogito at localhost:3000

### File Organization
- **Perfect modularity**: Each file handles single responsibility
- **Clear separation**: Backend routes, frontend modules, API client
- **Standard structure**: Follows Express.js conventions
- **Asset organization**: CSS, JS, and HTML properly separated

---

## Success Metrics

### File Size Compliance
- **100% compliance**: All files under 200-line limit
- **Optimal sizing**: Most files 25-100 lines for easy comprehension
- **Focused modules**: Clear, single-purpose components
- **Maintainable codebase**: Easy navigation and modification

### Code Quality
- **Modern standards**: ES6 modules throughout
- **Error handling**: Comprehensive error management and fallbacks
- **User experience**: Responsive, interactive interface
- **Clean architecture**: Clear separation of concerns

### Integration Success
- **Seamless communication**: Smooth API integration with main Cogito
- **Avatar targeting**: Reliable Golden Horde persona selection
- **Fallback handling**: Graceful degradation when main system unavailable
- **Session management**: Secure, reliable authentication

---

## Usage Instructions

### Development
```bash
cd golden-horde-app
npm install
npm run dev  # Development with auto-reload
```

### Production
```bash
npm start    # Production server
```

### Access
- **Main Interface**: http://localhost:3001/
- **Login**: http://localhost:3001/login
- **Health Check**: http://localhost:3001/health

---

## Future Enhancements

### Planned Features
- **Real-time updates**: WebSocket integration for live conversation
- **Prompt sharing**: Community-contributed template library
- **Conversation history**: Persistent chat session storage
- **Advanced authentication**: Integration with OAuth providers

### Integration Opportunities
- **Voice interface**: Speech-to-text and text-to-speech integration
- **Mobile app**: React Native or Progressive Web App version
- **Analytics**: User interaction and conversation analytics
- **Customization**: User-specific prompt libraries and preferences

---

*This INTENTIONS.md represents a well-architected standalone application demonstrating ideal file organization, size compliance, and clean integration patterns. The Golden Horde app serves as an exemplar of focused, maintainable web application design.*
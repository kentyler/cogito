# Browser Extension Architecture

**Purpose**: Chromium browser extension for capturing conversations from Claude.ai and ChatGPT platforms. Provides seamless integration with the main Cogito system for conversation analysis, query processing, and intelligent assistance directly from web browsers.

**Token Optimization**: 🎯 **~1,800 tokens** (down from ~3,200 with monolithic CSS structure)

---

## Core Architectural Principles

### Manifest V3 Compliance
- **Modern extension API**: Uses latest Chrome extension architecture
- **Service worker background**: Efficient background processing
- **Content script injection**: Platform-specific conversation capture
- **Side panel integration**: Modern Chrome sidebar interface

### File Size Excellence
- **Perfect compliance**: All files under 200-line limit after CSS modularization
- **Largest JS file**: 199 lines (openai-capture.js)
- **Modular CSS**: Split 310-line monolithic file into 5 focused modules
- **Clean organization**: Each file handles single, clear responsibility

### Platform Integration
- **Claude.ai support**: Native conversation capture and analysis
- **ChatGPT support**: OpenAI conversation integration
- **Cogito API integration**: Seamless communication with main system
- **Cross-platform compatibility**: Works across Chromium-based browsers

---

## Extension Structure

### 📋 **manifest.json** - Extension Configuration
**Purpose**: Chrome extension manifest defining permissions, content scripts, and capabilities

**Key Features**:
- **Manifest V3**: Latest Chrome extension standard
- **Host permissions**: Claude.ai, ChatGPT, and Cogito server domains
- **Content scripts**: Platform-specific conversation capture
- **Side panel**: Modern Chrome sidebar interface
- **Background service worker**: Efficient background processing

**Permissions**:
- `activeTab` - Access to current tab content
- `storage` - Extension data persistence
- `sidePanel` - Chrome side panel integration

### 🔧 **background.js** (126 lines) - Service Worker
**Purpose**: Background script managing extension lifecycle and message passing

**Core Functions**:
- **Side panel management**: Automatic panel opening on AI sites
- **Message routing**: Communication between content scripts and sidebar
- **Storage operations**: Extension configuration persistence
- **Tab monitoring**: Active tab tracking and state management

**Pattern**: Service worker with event-driven architecture for efficient resource usage

### 🎯 **Content Scripts** - Platform Capture Modules

#### **claude-capture.js** (157 lines) - Claude.ai Integration
**Purpose**: Captures conversations from Claude.ai interface

**Key Features**:
- **DOM observation**: Real-time conversation monitoring
- **Message extraction**: User prompts and assistant responses
- **Metadata collection**: Timestamps, conversation context
- **API forwarding**: Sends captured data to Cogito system

**Capture Strategy**: MutationObserver for dynamic content detection

#### **openai-capture.js** (199 lines) - ChatGPT Integration  
**Purpose**: Captures conversations from ChatGPT interface

**Key Features**:
- **Chat monitoring**: Real-time OpenAI conversation tracking
- **Response parsing**: AI response extraction and formatting
- **Context preservation**: Conversation history and metadata
- **Cogito integration**: Seamless data forwarding

**Pattern**: Platform-specific DOM parsing with intelligent content recognition

### 🎨 **Sidebar Interface** - User Control Panel

#### **sidebar.html** - Main Interface Structure
**Purpose**: Chrome side panel HTML structure with modular CSS loading

**Architecture**:
- **Modular CSS**: 5 specialized stylesheets for maintainability
- **Authentication section**: Login/logout interface
- **Capture controls**: Toggle switches for conversation monitoring
- **Query interface**: Direct Cogito interaction capabilities

#### **Modular CSS Architecture** (302 total lines split into 5 modules)

**🎨 css/base.css** (48 lines) - Foundation Styles
- **Reset styles**: Cross-browser normalization
- **Typography**: Font system and text hierarchy
- **Layout foundation**: App structure and section organization
- **Header styling**: Cogito branding and identity

**📝 css/forms.css** (61 lines) - Form & Input Components
- **Input styling**: Email, password, textarea styling
- **Button system**: Primary buttons, link buttons with states
- **Form layout**: Login forms and input validation
- **Interactive states**: Focus, hover, disabled states

**👤 css/user-interface.css** (92 lines) - User Controls
- **User section**: Authentication state display
- **Client selector**: Multi-client interface dropdown
- **Toggle switches**: Conversation capture controls
- **Status indicators**: Real-time feedback and state display

**🧩 css/components.css** (47 lines) - UI Components  
- **Query interface**: Textarea and response area styling
- **Response formatting**: Content display and typography
- **Error messaging**: User feedback and validation
- **Section headers**: Interface organization and hierarchy

**⚡ css/utilities.css** (54 lines) - Utilities & Animations
- **Loading states**: Spinners and overlays
- **Animations**: Smooth transitions and micro-interactions
- **Utility classes**: Hidden states and helper classes
- **Scrollbar styling**: Custom scrollbar appearance

#### **sidebar-main.js** (155 lines) - Interface Orchestration
**Purpose**: Main sidebar application controller

**Key Functions**:
- **Module initialization**: Auth, query, and UI manager coordination
- **Event handling**: User interactions and form submissions
- **State management**: Extension state and user session
- **API coordination**: Communication with background script

**Pattern**: Module coordination with event-driven architecture

#### **Modular JavaScript Library** - Specialized Managers

**🔐 lib/auth-manager.js** (125 lines) - Authentication System
- **Login/logout flow**: User credential management
- **Session persistence**: Extension storage integration
- **Token management**: API authentication handling
- **Client selection**: Multi-client environment support

**❓ lib/query-manager.js** (66 lines) - Query Processing
- **Query submission**: User questions to Cogito API
- **Response handling**: AI response formatting and display
- **Error management**: User-friendly error messaging
- **Loading states**: Visual feedback during processing

**🎛️ lib/ui-manager.js** (60 lines) - Interface Management
- **UI state control**: Section visibility and transitions
- **Form validation**: Input checking and user feedback
- **Dynamic content**: Real-time interface updates
- **Event delegation**: Centralized event handling

### 🔌 **popup.js** (166 lines) - Extension Popup
**Purpose**: Browser action popup interface (fallback for older browsers)

**Features**:
- **Quick access**: Essential extension controls
- **Status display**: Current capture state and settings
- **Settings panel**: Extension configuration options
- **Compatibility**: Fallback for browsers without side panel support

---

## Key Design Decisions

### Platform-Specific Capture
- **Dedicated modules**: Separate capture logic for Claude.ai vs ChatGPT
- **DOM observation**: Real-time content monitoring without polling
- **Intelligent parsing**: Context-aware message extraction
- **Error resilience**: Graceful handling of platform UI changes

### Modular CSS Architecture
- **Logical separation**: Base, forms, components, utilities organization
- **Maintainability**: Small, focused files under 100 lines each
- **Load optimization**: Selective loading based on interface needs
- **Theme consistency**: Unified color palette and typography

### Chrome Extension Best Practices
- **Manifest V3**: Future-proof extension architecture
- **Service worker**: Efficient background processing
- **Content script isolation**: Secure platform integration
- **Permission minimization**: Only required permissions requested

---

## Development Patterns

### Content Script Communication
```javascript
// Send captured data to background
chrome.runtime.sendMessage({
  type: 'CONVERSATION_CAPTURED',
  data: {
    platform: 'claude',
    messages: conversationData,
    timestamp: Date.now()
  }
});
```

### Background Message Routing
```javascript
// Route messages between components
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'CONVERSATION_CAPTURED':
      forwardToCogito(message.data);
      break;
    case 'TOGGLE_CAPTURE':
      updateCaptureState(message.enabled);
      break;
  }
});
```

### CSS Modular Loading
```html
<!-- Modular CSS architecture -->
<link rel="stylesheet" href="css/base.css">
<link rel="stylesheet" href="css/forms.css">
<link rel="stylesheet" href="css/user-interface.css">
<link rel="stylesheet" href="css/components.css">
<link rel="stylesheet" href="css/utilities.css">
```

---

## Integration Points

### Main Cogito System
- **API endpoints**: Conversation capture and query processing
- **Authentication**: User session and client selection
- **Data forwarding**: Real-time conversation streaming
- **Response handling**: AI-generated responses and analysis

### Browser Platform
- **Chrome APIs**: Extension lifecycle and permissions
- **Storage API**: Settings and session persistence  
- **Messaging API**: Cross-component communication
- **Side panel API**: Modern Chrome interface integration

### Target Platforms
- **Claude.ai**: Anthropic's Claude interface
- **ChatGPT**: OpenAI's conversation interface
- **Future platforms**: Extensible architecture for new AI sites

---

## Technical Specifications

### Browser Compatibility
- **Chrome/Chromium**: Primary target (Manifest V3)
- **Edge**: Chromium-based compatibility
- **Brave**: Chromium-based compatibility
- **Firefox**: Future consideration (requires Manifest V2 adaptation)

### Platform Coverage
- **Claude.ai**: Full conversation capture and analysis
- **ChatGPT**: Complete OpenAI integration
- **Local development**: localhost:3000 integration
- **Production**: cogito-app.onrender.com support

### File Organization
- **Root level**: Main extension files (manifest, background, popups)
- **lib/**: Modular JavaScript managers
- **css/**: Modular stylesheet organization
- **Platform scripts**: Content scripts for specific platforms

---

## Success Metrics

### File Size Compliance
- **100% compliance**: All files under 200-line limit after modularization
- **CSS optimization**: 310-line monolith → 5 focused modules (47-92 lines each)
- **JavaScript efficiency**: Largest file 199 lines (openai-capture.js)
- **Maintainable structure**: Easy navigation and modification

### User Experience
- **Seamless capture**: Real-time conversation monitoring
- **Intuitive interface**: Clear controls and status indicators
- **Fast response**: Efficient background processing
- **Cross-platform**: Consistent experience across AI platforms

### Integration Quality
- **API reliability**: Stable communication with main Cogito system
- **Error handling**: Graceful fallbacks and user feedback
- **Session management**: Persistent authentication and settings
- **Performance**: Minimal impact on browsing experience

---

## Future Enhancements

### Platform Expansion
- **Additional AI sites**: Perplexity, Bard, other emerging platforms
- **Social platforms**: Twitter, Reddit AI conversation capture
- **Documentation sites**: Stack Overflow, GitHub discussion capture
- **Email integration**: Gmail, Outlook conversation analysis

### Advanced Features
- **Real-time analysis**: Live conversation insights and suggestions
- **Context awareness**: Page content integration with queries
- **Batch processing**: Multiple conversation analysis
- **Export capabilities**: Conversation data export and sharing

### Technical Improvements
- **Firefox support**: Manifest V2 compatibility layer
- **Mobile support**: Progressive Web App integration
- **Offline mode**: Local processing capabilities
- **Performance optimization**: Memory usage and CPU efficiency

---

*This INTENTIONS.md represents a well-architected browser extension demonstrating modern Chrome extension development patterns, modular CSS organization, and seamless integration with the main Cogito system.*
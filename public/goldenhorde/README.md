# Golden Horde Interface

A collective intelligence interface for the Golden Horde with built-in prompt templates.

## Features

- **Restricted Access**: Requires authentication, isolated from main Cogito interface
- **Prompt Library**: Pre-designed prompt templates organized by category
- **Clean UI**: Simplified interface focused on conversation
- **Search**: Filter prompt templates by keyword
- **Real-time Chat**: Direct integration with Cogito's conversation API

## Access

- **URL**: `/goldenhorde/`
- **Authentication**: Required (redirects to main login if not authenticated)
- **Permissions**: Currently allows all authenticated users (extensible for role-based access)

## Directory Structure

```
public/goldenhorde/
├── index.html          # Main Golden Horde interface
├── css/
│   └── goldenhorde.css # Custom styles for Golden Horde interface
├── js/
│   ├── auth.js         # Authentication handling
│   └── goldenhorde.js  # Chat functionality
└── README.md           # This file
```

## Prompt Categories

### 🚀 Quick Start
- Explain a Topic
- Problem Solving

### 📊 Analysis
- Data Analysis
- Compare Options  
- Risk Assessment

### ✍️ Writing
- Email Draft
- Summarize
- Rewrite Text

### 📋 Planning
- Project Plan
- Goal Planning
- Decision Help

### 🎨 Creative
- Brainstorm
- Create Story

## Security Features

- **Route Protection**: All chat routes require authentication
- **Asset Security**: Only serves .css and .js files from designated folders
- **Session Validation**: Checks authentication status before loading interface
- **Access Logging**: Logs chat access for audit purposes

## Integration

- Uses existing Cogito conversation API (`/api/conversations`)
- Maintains session state with main Cogito application
- Supports logout that returns to main interface

## Customization

### Adding New Prompt Templates

Edit the HTML in `index.html` to add new prompt categories or individual prompts:

```html
<button class="prompt-item ..." onclick="usePrompt('Your prompt text here')">
    📝 Your Prompt Name
</button>
```

### Access Control

Modify `requireChatAccess()` in `server/routes/chat-interface.js` to add role-based restrictions:

```javascript
// Example: Restrict to specific roles
if (!['admin', 'chat_user'].includes(user.role)) {
    return res.status(403).json({ error: 'Chat access denied' });
}
```

### Styling

Edit `public/goldenhorde/css/goldenhorde.css` to customize appearance while maintaining the clean, focused design.

## Development Notes

- Interface is self-contained within `/goldenhorde/` folder
- No external dependencies beyond Tailwind CSS (loaded from CDN)
- Graceful fallback if main Cogito API is unavailable
- Real-time typing indicators and message animations
- Character counting and input validation
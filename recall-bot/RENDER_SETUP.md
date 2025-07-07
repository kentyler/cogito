# Render Setup for Recall Bot

## Quick Setup Steps

### 1. Environment Variables in Render
Set these in your Render web service environment:

```
DATABASE_URL         # Automatically set if using Render PostgreSQL
RECALL_API_KEY       # Your Recall.ai API key
ANTHROPIC_API_KEY    # Claude API key for intelligent responses
OPENAI_API_KEY       # Optional - for embeddings
SESSION_SECRET       # Random secure string for session encryption
NODE_ENV             # Set to "production" on Render
```

### 2. Deploy
```bash
git add .
git commit -m "Add public bot creator UI at /create-bot"
git push origin main
```

### 3. Access Points
- **Bot Creator UI**: `https://your-app.onrender.com/create-bot/`
- **Health Check**: `https://your-app.onrender.com/health`
- **API Endpoint**: `POST https://your-app.onrender.com/api/create-bot`

### 4. Test the UI
1. Visit `https://your-app.onrender.com/create-bot/`
2. Enter a Zoom URL
3. Click "Add Cogito to Meeting"
4. Cogito should join your meeting

### 5. Using Cogito in Your Meeting

To ask Cogito a question during the meeting, use the breaker codes:

1. Say **"ninety nine"** (or "99") to start your question
2. Ask your question
3. Say **"sixty six"** (or "66") to end your question

**Example:**
> "Ninety nine, what were the key action items we discussed so far? Sixty six."

Cogito will respond in the meeting chat with an intelligent answer based on the conversation context.

## Note
The bot creator UI is intentionally at `/create-bot/` subfolder so the main Render URL can be used for other purposes.
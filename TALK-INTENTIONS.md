# Talk System - Design Intentions

## Core Philosophy
Transform the conversation system from a hierarchical "meetings" model where users command an AI servant, to an egalitarian "talk" model where all participants (human and AI) engage as equals in an emergent, unstructured conversation.

## Key Principles

### 1. LLM as Full Participant
- Remove "User" vs "AI" distinctions in UI
- All participants have equal standing in the conversation
- LLM can be addressed directly (@Cogito) or participate naturally
- No pre-filtering or structuring of content before LLM sees it

### 2. Emergent Structure
- No predetermined conversation flow or categories
- Patterns emerge from the conversation itself
- Raw, unfiltered access to conversation history
- Let the LLM interpret and organize as needed

### 3. Conversational Gestures
Two simple gestures that point in different directions:

**@ = Forward Pointing (Attention/Summoning)**
- @Cogito - addresses the LLM participant
- @KenTyler - addresses a human participant  
- Creates notifications for addressed participants
- Points toward future engagement

**/ = Backward Pointing (Citation/Context)**
- /yesterday - temporal reference
- /linkedin - fixed reference to external source
- /sarah-mentioned - ephemeral reference to prior context
- Points toward grounding and provenance

## Implementation Design

### Gesture Detection
```javascript
function parseGestures(content) {
  return {
    mentions: content.match(/@(\w+)/g) || [],      // Forward gestures
    citations: content.match(/\/([^\s]+)/g) || []  // Backward gestures
  };
}
```

### Data Model
```javascript
{
  content: "Based on /yesterday's-standup, @KenTyler should review this",
  gestures: [
    { 
      type: 'citation', 
      raw: '/yesterday's-standup',
      direction: 'backward'
    },
    { 
      type: 'mention', 
      raw: '@KenTyler',
      direction: 'forward',
      creates_notification: true
    }
  ]
}
```

### Citation Types

**Fixed References** (permanent anchors)
- /linkedin → Always points to LinkedIn discussions
- /docs → Project documentation
- /architecture → Architecture decisions
- User-configurable shortcuts to common sources

**Ephemeral References** (context-dependent)
- /yesterday → Resolves to specific date
- /conflict-club-8-13 → Specific event
- /that-bug → Requires disambiguation from context
- LLM interprets these using conversation history

### Notification System
When a participant is mentioned (@username):
1. Parse display_name to find user_id
2. Create notification record in database
3. Show unread mentions on next login
4. Highlight mentioned turns in conversation view

### Typeahead Assistance
Both @ and / trigger typeahead dropdowns:

**@mentions dropdown shows:**
- Active participants (🤖 Cogito, 👤 users)
- Recently active users
- All available participants

**/citations dropdown shows:**
- Fixed references (🔗 permanent links)
- Temporal helpers (📅 yesterday, last-week)
- Recent citations (💬 from conversation history)
- Learned frequently-used patterns

## Database Schema

### Core Changes
```sql
-- Rename meetings metaphor to talk
ALTER TABLE meetings.meetings RENAME TO conversation.talks;
ALTER TABLE meetings.turns RENAME TO conversation.turns;

-- Add gesture tracking
CREATE TABLE conversation.gestures (
  id BIGSERIAL PRIMARY KEY,
  turn_id BIGINT REFERENCES turns(id),
  gesture_type VARCHAR(20), -- 'mention' or 'citation'
  raw_text TEXT,            -- '@KenTyler' or '/yesterday'
  direction VARCHAR(20),    -- 'forward' or 'backward'
  target_type VARCHAR(50),  -- 'user', 'url', 'temporal', etc
  target_id TEXT,          -- Resolved reference
  metadata JSONB
);

-- Notification queue for mentions
CREATE TABLE conversation.notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  turn_id BIGINT REFERENCES turns(id),
  created_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP NULL
);

-- Fixed citation references
CREATE TABLE conversation.fixed_references (
  name VARCHAR(50) PRIMARY KEY,
  url TEXT,
  description TEXT,
  client_id BIGINT
);
```

## UI Changes

### Unified Participant Display
```html
<!-- All turns display equally, just with participant name -->
<div class="turn">
  <span class="participant">Ken Tyler</span>
  <span class="content">Based on /yesterday's discussion...</span>
</div>

<div class="turn">
  <span class="participant">Cogito</span>
  <span class="content">I understand you're referring to...</span>
</div>
```

### Gesture Visualization
```css
.mention { 
  color: #2196F3;  /* Forward/attention color */
  cursor: pointer;
}

.citation { 
  color: #757575;  /* Backward/context color */
  border-bottom: 1px dotted;
}

.mention:hover, .citation:hover {
  background: rgba(0,0,0,0.05);
  /* Show tooltip with resolution */
}
```

## Migration Path

### Phase 1: Gesture System
1. Implement @ mention detection and notifications
2. Implement / citation detection and storage
3. Add typeahead for both gestures
4. Deploy with existing meeting structure

### Phase 2: UI Equality
1. Remove "User" vs "AI" labels
2. Implement unified participant display
3. Add participant avatars/colors
4. Show all turns equally

### Phase 3: Database Rename
1. Create migration to rename meetings → talks
2. Update all references in codebase
3. Maintain backwards compatibility APIs
4. Gradually phase out "meeting" terminology

### Phase 4: Remove Pre-structuring
1. Eliminate pre-categorization of content
2. Give LLM raw access to turn stream
3. Let patterns emerge from usage
4. Remove forced conversation structures

## Success Metrics

### Philosophical Success
- Users naturally treat Cogito as a conversation partner, not a tool
- Conversations flow without predetermined structure
- Rich citation/reference networks emerge organically
- Participant equality reflected in language and behavior

### Technical Success
- @ mentions create reliable notifications
- / citations capture provenance naturally
- Typeahead makes gestures discoverable
- System remains simple and intuitive
- No increase in cognitive load

### User Experience Success
- Natural conversation flow without friction
- Easy to reference prior context
- Clear when someone needs attention
- No confusion about gesture meanings
- Improved sense of collaborative dialogue

## Future Possibilities

### Extended Gesture Vocabulary (if needed)
- #topics for concept tagging
- ^ for "previous turn" reference
- Time-based citations like /2024-01-15:14:30

### Conversation Graph Visualization
- Show network of mentions and citations
- Visualize how ideas flow through conversation
- Track provenance of concepts
- Identity conversation patterns

### AI Gesture Understanding
- LLM learns personal citation patterns
- Resolves ambiguous references from context
- Suggests relevant citations while typing
- Maintains citation consistency

---

*This design creates a simple but powerful system where conversations are egalitarian exchanges between participants, with natural gestures for attention (@) and context (/), removing the artificial hierarchy between humans and AI.*
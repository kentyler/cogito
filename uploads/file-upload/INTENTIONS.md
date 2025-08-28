# File Upload System Architecture

**Purpose**: Comprehensive file upload, processing, and analysis system. Handles document ingestion, content extraction, vector embedding generation, and specialized processing for thinking tool artifacts.

**Token Optimization**: 🎯 **~1,500 tokens** to understand the entire file upload system

---

## Current Architecture

### Core Components

#### `file-upload-manager.js` 
**Purpose**: Main orchestrator for file upload operations
**Responsibilities**: 
- Coordinate upload workflow
- Manage file storage in database
- Trigger content extraction and embedding generation

#### `file-processor.js`
**Purpose**: Process uploaded files for storage and analysis
**Responsibilities**:
- File validation and metadata extraction
- Storage coordination with database
- Format detection and routing

#### `content-extractor.js` (107 lines)
**Purpose**: Extract text content from various file formats
**Responsibilities**:
- Plain text extraction (.txt, .md)
- PDF text extraction
- Future: Word documents, spreadsheets
**Pattern**: Format-specific extraction strategies

#### `text-chunker.js`
**Purpose**: Split large texts into semantic chunks
**Responsibilities**:
- Intelligent text segmentation
- Maintain context across chunks
- Optimize for embedding generation

#### `vector-embedding-service.js` (76 lines)
**Purpose**: Generate vector embeddings for semantic search
**Responsibilities**:
- OpenAI embedding API integration
- Batch processing for efficiency
- Store embeddings with chunks

#### `file-search-service.js`
**Purpose**: Semantic search across uploaded files
**Responsibilities**:
- Vector similarity search
- Result ranking and filtering
- Context retrieval for LLM queries

---

## Thinking Tools Integration (Planned)

### Design Cards

#### Card: Unified Drop Interface
**Pattern**: Extend conversation interface to accept file drops
**Forces**: 
- Users want natural file interaction in conversations
- Existing upload button feels disconnected from chat flow
- Different file types need different handling
**Solution**:
- Make prompt textarea accept file drops
- Route through existing upload infrastructure
- Generate conversational responses for uploads
**Integration Points**:
- `public/js/ui-components/conversation.js` - Add drop handlers
- `file-upload-manager.js` - Process dropped files
- Return upload confirmation as conversation turn

#### Card: .cogito File Recognition
**Pattern**: Special handling for thinking tool artifacts
**Forces**:
- .cogito files contain structured thinking data needing analysis
- Regular upload flow insufficient for thinking tools
- Need to preserve both storage and analysis
**Solution**:
- Detect .cogito extension in file-processor
- Parse and validate JSON structure
- Branch to thinking tool analysis pipeline
**New Component**: `thinking-tool-processor.js`
```javascript
class ThinkingToolProcessor {
  async process(fileData, metadata) {
    const toolData = JSON.parse(fileData);
    await this.validateStructure(toolData);
    await this.storeSubmission(toolData, metadata);
    const analysis = await this.generateAnalysis(toolData);
    return { stored: true, analysis };
  }
}
```

#### Card: Analysis Pipeline
**Pattern**: Claude-powered analysis of thinking tools
**Forces**:
- Raw tool data needs interpretation
- Users want insights, not just storage
- Analysis should consider original context
**Solution**:
- Extract prompt and data from .cogito file
- Construct analysis prompt for Claude
- Return insights as conversation response
**Integration**:
```javascript
// In file-processor.js
if (file.name.endsWith('.cogito')) {
  const processor = new ThinkingToolProcessor();
  const result = await processor.process(content, metadata);
  return {
    type: 'thinking_tool',
    fileId: storedFile.id,
    analysis: result.analysis
  };
}
```

#### Card: Extensible Handler Registry
**Pattern**: Pluggable file type handlers
**Forces**:
- System will need more special file types
- Avoid hardcoding file logic
- Maintain clean separation of concerns
**Solution**:
```javascript
class FileHandlerRegistry {
  constructor() {
    this.handlers = new Map();
    this.registerDefaults();
  }
  
  register(extension, handler) {
    this.handlers.set(extension, handler);
  }
  
  async process(file) {
    const ext = path.extname(file.name);
    const handler = this.handlers.get(ext) || this.defaultHandler;
    return await handler.process(file);
  }
}
```
**Future Extensions**:
- `.edn` → EDN parser for pattern analysis
- `.csv` → Data analysis and visualization
- `.json` → Schema validation and analysis
- `.py/.js` → Code analysis and insights

---

## Database Schema Extensions

### New Tables (thinking_tools schema)

```sql
-- Store thinking tool submissions
CREATE TABLE thinking_tools.tool_submissions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  file_id UUID REFERENCES context.files(id),
  user_id BIGINT REFERENCES users(id),
  meeting_id UUID REFERENCES meetings.meetings(id),
  tool_type VARCHAR(100), -- 'evaporating_cloud', 'current_reality_tree', etc.
  tool_data JSONB NOT NULL, -- The structured tool data
  original_prompt TEXT, -- The artifact's original prompt
  metadata JSONB, -- Additional context
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store analysis results
CREATE TABLE thinking_tools.tool_analyses (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  submission_id BIGINT REFERENCES thinking_tools.tool_submissions(id),
  analysis_text TEXT NOT NULL,
  insights JSONB, -- Structured insights
  suggestions JSONB, -- Next steps/recommendations
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for queries
CREATE INDEX idx_tool_submissions_user ON thinking_tools.tool_submissions(user_id);
CREATE INDEX idx_tool_submissions_type ON thinking_tools.tool_submissions(tool_type);
```

---

## Implementation Plan

### Phase 1: Frontend Drop Support
1. ✅ Existing: `public/js/file-upload/file-upload-area.js` has drop support
2. NEW: Add drop handlers to `public/js/ui-components/conversation.js`
3. Route dropped files through existing upload API
4. Visual feedback during drag operations

### Phase 2: Backend Detection & Routing
1. Extend `file-processor.js` to detect .cogito files
2. Create `thinking-tool-processor.js` for specialized handling
3. Store in both context.files and thinking_tools.tool_submissions
4. Generate appropriate response based on file type

### Phase 3: Analysis Integration
1. Create analysis prompt templates
2. Integrate with LLM service for analysis
3. Store analysis results
4. Return as conversation turn

### Phase 4: Response Generation
1. Regular files: "✅ Uploaded {filename} ({size}) - {summary}"
2. .cogito files: Full analysis with insights and suggestions
3. Errors: Graceful fallback messages

---

## Success Metrics

- **Seamless UX**: File drops feel natural in conversation
- **Performance**: <3 second response for .cogito analysis
- **Reliability**: Graceful handling of invalid files
- **Extensibility**: Easy to add new file type handlers
- **Code Quality**: All files remain under 200 lines
- **Zero Regression**: Existing upload functionality unchanged

---

## API Changes

### Existing Endpoints (No Changes)
- `POST /api/upload` - Main upload endpoint
- `GET /api/files` - List uploaded files
- `GET /api/files/:id` - Get file details

### New Response Format for Conversations
```javascript
// When file uploaded via conversation drop
{
  type: 'file_upload',
  file: {
    id: 'uuid',
    name: 'example.cogito',
    type: 'thinking_tool'
  },
  response: {
    // For regular files
    message: 'Uploaded example.pdf (2.3MB)',
    summary: 'Document about...'
    
    // For .cogito files
    message: 'Analyzing thinking tool data...',
    analysis: {
      insights: [...],
      blindSpots: [...],
      suggestions: [...]
    }
  }
}
```

---

## Testing Strategy

1. **Unit Tests**: Each processor tested independently
2. **Integration Tests**: Full upload → analysis pipeline
3. **File Type Tests**: Various formats and edge cases
4. **Error Cases**: Invalid JSON, oversized files, malformed .cogito

---

## Security Considerations

1. **File Validation**: Size limits, type checking, virus scanning
2. **JSON Parsing**: Safe parsing with try/catch
3. **SQL Injection**: Use parameterized queries via DatabaseAgent
4. **XSS Prevention**: Sanitize file names and content
5. **Rate Limiting**: Prevent abuse of analysis endpoint

---

*This INTENTIONS.md documents the file upload system architecture and its planned extension for thinking tools integration, maintaining consistency with Cogito's modular patterns.*
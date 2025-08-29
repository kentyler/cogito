# Upload System

## Purpose
Comprehensive file upload and processing system that handles multiple file formats, generates embeddings, creates summaries, and stores processed content for semantic search. Supports PDF, text, and various document formats with AI-powered content analysis.

## Core Upload Components

### `upload-handlers-v2.js`
**Purpose**: Modern upload handlers using DatabaseAgent pattern
- Handles multiple file upload processing with proper authentication
- Integrates with DatabaseAgent for consistent database operations
- Provides structured error handling and response formatting
- Supports meeting context association for uploaded files

```javascript
export async function uploadFiles(req, res) {
  const db = new DatabaseAgent();
  
  try {
    // 1. Validate file upload request
    if (!req.files || req.files.length === 0) {
      return ApiResponses.badRequest(res, 'No files uploaded');
    }
    
    // 2. Extract user and client context from session
    const clientId = req.session?.user?.client_id;
    const userId = req.session?.user?.id;
    const meetingId = req.session?.meeting_id;
    
    // 3. Validate authentication and client selection
    if (!clientId) {
      return ApiResponses.unauthorized(res, 'Authentication required - no client selected');
    }
    
    // 4. Establish database connection
    await db.connect();
    
    const results = [];
    
    // 5. Process each uploaded file sequentially
    for (const file of req.files) {
      try {
        const result = await processFile(db, file, clientId, userId, meetingId);
        results.push(result);
      } catch (error) {
        // 6. Handle individual file processing errors
        console.error(`❌ Error processing file ${file.originalname}:`, error);
        results.push({
          filename: file.originalname,
          error: error.message,
          success: false
        });
      }
    }
    
    // 7. Return comprehensive upload results
    return ApiResponses.success(res, {
      files: results,
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });
    
  } catch (error) {
    console.error('Upload handler error:', error);
    return ApiResponses.internalError(res, 'File upload processing failed');
  } finally {
    await db.disconnect();
  }
}
```

### `upload-handlers.js`
**Purpose**: Legacy upload handlers (deprecated in favor of V2)
- Maintains compatibility for existing upload flows
- Provides fallback functionality during migration
- Contains original upload processing logic
- Should be migrated to V2 pattern over time

### `single-file-processor.js`
**Purpose**: Individual file processing orchestrator
- Coordinates processing of single files through appropriate processors
- Determines file type and routes to specialized processors
- Handles file metadata extraction and storage
- Manages embedding generation and database storage

```javascript
export async function processFile(db, file, clientId, userId, meetingId) {
  try {
    // 1. Determine file type and select appropriate processor
    const fileType = determineFileType(file);
    let processor;
    
    switch (fileType) {
      case 'pdf':
        processor = new PDFProcessor();
        break;
      case 'text':
        processor = new RegularFileProcessor();
        break;
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
    
    // 2. Extract file content using appropriate processor
    const extractedContent = await processor.extractContent(file);
    
    // 3. Store file metadata via DatabaseAgent
    const fileRecord = await db.fileOperations.createFile({
      filename: file.originalname,
      file_type: fileType,
      file_size: file.size,
      client_id: clientId,
      user_id: userId,
      meeting_id: meetingId,
      content: extractedContent
    });
    
    // 4. Process content into chunks with embeddings
    const chunks = await processor.processIntoChunks(extractedContent);
    
    // 5. Generate embeddings for each chunk
    const chunksWithEmbeddings = await Promise.all(
      chunks.map(async (chunk, index) => ({
        file_id: fileRecord.id,
        chunk_index: index,
        content: chunk.content,
        embedding: await generateEmbedding(chunk.content),
        metadata: chunk.metadata
      }))
    );
    
    // 6. Store chunks and embeddings
    await db.fileOperations.storeFileChunks(chunksWithEmbeddings);
    
    // 7. Generate file summary if configured
    const summary = await generateFileSummary(extractedContent);
    await db.fileOperations.updateFileSummary(fileRecord.id, summary);
    
    return {
      filename: file.originalname,
      file_id: fileRecord.id,
      chunks_created: chunksWithEmbeddings.length,
      summary_generated: Boolean(summary),
      success: true
    };
    
  } catch (error) {
    console.error('Single file processing error:', error);
    throw error;
  }
}
```

### `pdf-processor.js`
**Purpose**: PDF file processing and text extraction
- Handles PDF parsing and text extraction
- Preserves document structure and formatting
- Manages large PDF files with efficient processing
- Supports encrypted and complex PDF documents

```javascript
export class PDFProcessor {
  async extractContent(file) {
    try {
      // 1. Parse PDF file buffer
      const pdfData = await PDFParser.parse(file.buffer);
      
      // 2. Extract text content from all pages
      let extractedText = '';
      for (let i = 0; i < pdfData.numPages; i++) {
        const page = await pdfData.getPage(i + 1);
        const pageText = await page.getTextContent();
        
        // 3. Combine text items into readable content
        const pageString = pageText.items
          .map(item => item.str)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
          
        extractedText += pageString + '\n\n';
      }
      
      // 4. Clean and normalize extracted text
      return this.cleanExtractedText(extractedText);
      
    } catch (error) {
      console.error('PDF processing error:', error);
      throw new Error('Failed to extract PDF content');
    }
  }
  
  async processIntoChunks(content) {
    // 1. Split content into manageable chunks
    const chunks = chunkText(content, 2000);
    
    // 2. Add metadata to each chunk
    return chunks.map((chunk, index) => ({
      content: chunk,
      metadata: {
        chunk_type: 'pdf_text',
        chunk_index: index,
        word_count: chunk.split(/\s+/).length
      }
    }));
  }
  
  cleanExtractedText(text) {
    // 1. Remove excessive whitespace
    return text
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
```

### `regular-file-processor.js`
**Purpose**: Text and document file processing
- Handles plain text, markdown, and document files
- Preserves text formatting and structure
- Manages character encoding detection
- Supports various text-based file formats

```javascript
export class RegularFileProcessor {
  async extractContent(file) {
    try {
      // 1. Detect character encoding
      const encoding = this.detectEncoding(file.buffer);
      
      // 2. Convert buffer to text using detected encoding
      const content = file.buffer.toString(encoding);
      
      // 3. Validate and clean content
      return this.validateAndCleanContent(content);
      
    } catch (error) {
      console.error('Regular file processing error:', error);
      throw new Error('Failed to extract file content');
    }
  }
  
  async processIntoChunks(content) {
    // 1. Split content preserving natural boundaries
    const chunks = this.intelligentChunking(content);
    
    // 2. Add appropriate metadata
    return chunks.map((chunk, index) => ({
      content: chunk,
      metadata: {
        chunk_type: 'text',
        chunk_index: index,
        character_count: chunk.length,
        line_count: chunk.split('\n').length
      }
    }));
  }
  
  intelligentChunking(content, maxChunkSize = 2000) {
    // 1. Split on paragraph boundaries first
    const paragraphs = content.split(/\n\s*\n/);
    const chunks = [];
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
      if (currentChunk.length + paragraph.length + 2 > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = paragraph;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }
}
```

### `file-processor.js`
**Purpose**: Core file processing utilities and embedding generation
- Provides text chunking algorithms for optimal embedding generation
- Handles OpenAI embedding generation
- Manages file content processing pipeline
- Contains utility functions for content analysis

```javascript
// Initialize OpenAI client for embedding generation
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export function chunkText(text, maxChunkSize = 2000) {
  // 1. Split text into lines for processing
  const chunks = [];
  const lines = text.split('\n');
  let currentChunk = '';
  
  // 2. Build chunks respecting line boundaries
  for (const line of lines) {
    if (currentChunk.length + line.length + 1 > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = line;
    } else {
      currentChunk += (currentChunk ? '\n' : '') + line;
    }
  }
  
  // 3. Add final chunk if exists
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

export async function generateEmbedding(text) {
  try {
    // 1. Generate embedding using OpenAI text-embedding-3-small
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      dimensions: 1536
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return null;
  }
}

export async function processFileContent(client, fileId, content, clientId) {
  // 1. Chunk content into manageable pieces
  const chunks = chunkText(content);
  
  // 2. Process each chunk with embedding generation
  for (let i = 0; i < chunks.length; i++) {
    const chunkText = chunks[i];
    
    // 3. Generate embedding for chunk
    const embedding = await generateEmbedding(chunkText);
    
    // 4. Store chunk with embedding via database client
    await client.query(
      'INSERT INTO context.chunks (file_id, chunk_index, content, embedding, client_id) VALUES ($1, $2, $3, $4, $5)',
      [fileId, i, chunkText, JSON.stringify(embedding), clientId]
    );
  }
}
```

### `file-summary-generator.js`
**Purpose**: AI-powered file content summarization
- Generates intelligent summaries of uploaded file content
- Uses LLM processing for content analysis
- Creates structured summaries with key insights
- Provides file overview for user navigation

```javascript
export class FileSummaryGenerator {
  constructor(llmProvider) {
    this.llmProvider = llmProvider;
  }
  
  async generateSummary(fileContent, fileMetadata) {
    try {
      // 1. Prepare content for summarization
      const preparedContent = this.prepareContentForSummary(fileContent);
      
      // 2. Build summary prompt based on file type
      const prompt = this.buildSummaryPrompt(preparedContent, fileMetadata);
      
      // 3. Generate AI summary
      const summary = await this.llmProvider.generateSummary(prompt);
      
      // 4. Structure summary with metadata
      return {
        summary: summary,
        key_points: this.extractKeyPoints(summary),
        word_count: fileContent.split(/\s+/).length,
        generated_at: new Date(),
        summary_method: 'ai_generated'
      };
      
    } catch (error) {
      console.error('Summary generation error:', error);
      throw new Error('Failed to generate file summary');
    }
  }
  
  buildSummaryPrompt(content, metadata) {
    return `Please provide a comprehensive summary of the following ${metadata.file_type} file content.

Focus on:
- Main topics and themes
- Key insights or findings
- Important facts or data points
- Overall purpose or objective
- Notable quotes or statements

Content to summarize:
${content}

Provide a structured summary in 2-3 paragraphs that captures the essential information.`;
  }
}
```

## Database Integration

### File Operations (via DatabaseAgent)
```javascript
export class FileOperations {
  async createFile(fileData) {
    // 1. Store file metadata
    const { query, values } = this.queryBuilder.buildInsert('context', 'files', fileData);
    const result = await this.connector.query(query, values);
    return result.rows[0];
  }
  
  async storeFileChunks(chunksData) {
    // 1. Batch insert file chunks with embeddings
    const { query, values } = this.queryBuilder.buildBatchInsert('context', 'chunks', chunksData);
    const result = await this.connector.query(query, values);
    return result.rows;
  }
  
  async updateFileSummary(fileId, summary) {
    // 1. Update file record with generated summary
    const { query, values } = this.queryBuilder.buildUpdate('context', 'files', 
      { summary: summary }, 
      { id: fileId }
    );
    const result = await this.connector.query(query, values);
    return result.rows[0];
  }
  
  async getFilesByClient(clientId, filters = {}) {
    // 1. Query files with optional filtering
    const { query, values } = this.queryBuilder.buildSelect('context', 'files', {
      client_id: clientId,
      ...filters
    });
    const result = await this.connector.query(query, values);
    return result.rows;
  }
}
```

## File Processing Pipeline

### Upload Processing Flow
```
File Upload → Validation → Type Detection → Content Extraction → Chunking → Embedding → Storage → Summary
      ↓             ↓             ↓              ↓              ↓           ↓          ↓         ↓
Authentication  File Type    PDF/Text      Text Content    Text Chunks  Vectors   Database   AI Summary
Client Check    Routing      Processing    Normalization   Generation   Creation  Storage    Generation
```

### Processing Architecture
```javascript
export class FileProcessingPipeline {
  async processUploadedFile(file, userContext) {
    try {
      // 1. Validate file and user permissions
      await this.validateUpload(file, userContext);
      
      // 2. Extract content based on file type
      const content = await this.extractContent(file);
      
      // 3. Generate content chunks for embedding
      const chunks = await this.generateChunks(content);
      
      // 4. Create embeddings for semantic search
      const embeddings = await this.generateEmbeddings(chunks);
      
      // 5. Store file and chunks in database
      const fileRecord = await this.storeFileData(file, content, chunks, embeddings, userContext);
      
      // 6. Generate summary if configured
      if (this.shouldGenerateSummary(file)) {
        const summary = await this.generateSummary(content, fileRecord);
        await this.storeSummary(fileRecord.id, summary);
      }
      
      return fileRecord;
    } catch (error) {
      console.error('File processing pipeline error:', error);
      throw error;
    }
  }
}
```

## Security and Access Control

### Upload Security Manager
```javascript
export class UploadSecurityManager {
  validateFileUpload(file, userContext) {
    // 1. Check file size limits
    if (file.size > this.getMaxFileSize(userContext.clientId)) {
      throw new Error('File size exceeds limit');
    }
    
    // 2. Validate file type
    if (!this.isAllowedFileType(file.mimetype, userContext.clientId)) {
      throw new Error('File type not allowed');
    }
    
    // 3. Scan for malicious content
    if (this.containsMaliciousContent(file)) {
      throw new Error('File contains potentially malicious content');
    }
    
    return true;
  }
  
  sanitizeFileContent(content) {
    // 1. Remove potentially dangerous content
    // 2. Normalize text encoding
    // 3. Strip metadata that could contain sensitive information
    return this.applySanitizationRules(content);
  }
}
```

## Error Handling and Recovery

### Upload Error Management
```javascript
export class UploadErrorManager {
  handleProcessingError(error, file, context) {
    // 1. Classify error type
    const errorType = this.classifyError(error);
    
    // 2. Log error with context
    console.error(`Upload processing error [${errorType}]:`, {
      filename: file.originalname,
      fileSize: file.size,
      fileType: file.mimetype,
      error: error.message,
      context
    });
    
    // 3. Determine recovery strategy
    switch (errorType) {
      case 'CONTENT_EXTRACTION_FAILED':
        return this.retryWithAlternativeExtractor(file);
        
      case 'EMBEDDING_GENERATION_FAILED':
        return this.storeWithoutEmbedding(file, context);
        
      case 'STORAGE_FAILED':
        return this.retryStorage(file, context);
        
      default:
        throw error;
    }
  }
}
```

## Performance Optimization

### Batch Processing
```javascript
export class UploadOptimizer {
  async processBatchUploads(files, userContext) {
    // 1. Group files by type for optimized processing
    const filesByType = this.groupFilesByType(files);
    
    // 2. Process each group with appropriate batch size
    const results = [];
    for (const [fileType, typeFiles] of Object.entries(filesByType)) {
      const batchResults = await this.processBatch(typeFiles, userContext, fileType);
      results.push(...batchResults);
    }
    
    return results;
  }
  
  async generateEmbeddingsBatch(chunks) {
    // 1. Process embeddings in parallel with rate limiting
    const batchSize = 10;
    const embeddings = [];
    
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const batchEmbeddings = await Promise.all(
        batch.map(chunk => this.generateEmbeddingWithRetry(chunk))
      );
      embeddings.push(...batchEmbeddings);
      
      // Rate limiting delay
      await this.delay(100);
    }
    
    return embeddings;
  }
}
```

## Testing Strategies

### Upload System Testing
```javascript
describe('Upload System', () => {
  test('processes PDF file correctly', async () => {
    const mockPDFFile = {
      originalname: 'test.pdf',
      buffer: Buffer.from('mock pdf content'),
      mimetype: 'application/pdf',
      size: 1024
    };
    
    const processor = new PDFProcessor();
    const content = await processor.extractContent(mockPDFFile);
    
    expect(content).toBeDefined();
    expect(typeof content).toBe('string');
  });
  
  test('generates embeddings for text chunks', async () => {
    const mockText = 'This is a sample text for embedding generation testing.';
    
    const embedding = await generateEmbedding(mockText);
    
    expect(embedding).toBeDefined();
    expect(Array.isArray(embedding)).toBe(true);
    expect(embedding).toHaveLength(1536);
  });
  
  test('chunks text with proper boundaries', () => {
    const longText = 'Lorem ipsum '.repeat(200);
    const chunks = chunkText(longText, 500);
    
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every(chunk => chunk.length <= 500)).toBe(true);
  });
});
```
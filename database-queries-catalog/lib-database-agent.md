# lib/database-agent.js - Query Catalog

## File Summary
- **Purpose**: Main DatabaseAgent coordinator (delegates to specialized modules)
- **Query Count**: 0 direct queries (orchestration layer)
- **Main Operations**: Coordinates DatabaseConnector, SchemaInspector, TranscriptProcessor, SearchAnalyzer

## Query Analysis

**No direct database queries found in this file.**

This is an orchestration layer that delegates all database operations to specialized modules:
- **DatabaseConnector** - Connection management and basic queries
- **SchemaInspector** - Schema inspection and caching
- **TranscriptProcessor** - Transcript import and analysis
- **SearchAnalyzer** - Search and analytics operations

## Database Operations (Delegated)

All operations delegate to specialized modules:
```javascript
// Connection operations → DatabaseConnector
async query(sql, params)
async transaction(callback)

// Schema operations → SchemaInspector  
async getSchema(forceRefresh)
async findTable(tableName)

// Transcript operations → TranscriptProcessor
async getMeetingTranscripts(options)
async importTranscript(options)
async analyzeTranscript(meetingId)

// Search operations → SearchAnalyzer
async searchTranscripts(searchTerm, options)
async getUserStats(userId)
```

## Proposed DatabaseAgent Methods

This IS the main DatabaseAgent class. The specialized modules contain the actual database queries.

## Domain Classification
- **Primary**: Database Orchestration
- **Secondary**: Module Coordination
- **Pattern**: Facade pattern over specialized database modules

## Notes
- Modular architecture with clear separation of concerns
- Each specialized module handles its own domain of database operations
- Provides unified API while delegating to appropriate specialists
- Singleton instance exported as `dbAgent` for backward compatibility
- No direct database queries - purely orchestration layer
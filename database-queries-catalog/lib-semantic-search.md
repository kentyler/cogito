# lib/semantic-search.js - Query Catalog

## File Summary
- **Purpose**: Semantic search for locations with Python embedding integration
- **Query Count**: 1 query (fallback keyword search)
- **Main Operations**: Semantic search via Python, fallback keyword search

## Query Analysis

### Query 1: Keyword Search Fallback (Line 84)
```javascript
const query = `
  SELECT file_path, description, project, category, tags,
         last_accessed, metadata
  FROM locations
  WHERE 
    LOWER(file_path) LIKE LOWER($1) OR
    LOWER(description) LIKE LOWER($1) OR
    LOWER(project) LIKE LOWER($1) OR
    LOWER(category) LIKE LOWER($1) OR
    LOWER(tags) LIKE LOWER($1)
  ORDER BY last_accessed DESC
  LIMIT $2
`;
```
**Context**: `keywordSearch` method  
**Purpose**: Fallback search when semantic search fails or returns no results  
**Parameters**: `searchPattern` (with wildcards), `limit`  
**Returns**: Location records matching keyword search

## Python Integration Operations

The main semantic search delegates to Python script:
- Semantic search via `semantic-location-search.py`
- Embedding generation for new locations
- No direct database queries for semantic operations

## Proposed DatabaseAgent Methods

```javascript
// Location search operations
async searchLocationsByKeyword(searchTerm, limit = 5)
// Semantic operations handled by Python script
```

## Domain Classification
- **Primary**: Location Search
- **Secondary**: Semantic/Embedding Integration
- **Pattern**: Hybrid search with Python delegation

## Notes
- Primary search uses Python script for semantic embeddings
- Falls back to keyword search on error or no results
- Uses LIKE with case-insensitive matching for fallback
- Orders by last_accessed for relevance
- Spawns Python subprocess for embedding operations
- Default similarity score of 0.5 for keyword matches
- Builds rich search text combining multiple fields
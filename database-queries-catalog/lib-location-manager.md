# lib/location-manager.js - Query Catalog

## File Summary
- **Purpose**: Manage file locations with descriptions for quick lookup
- **Query Count**: 10 queries
- **Main Operations**: CRUD operations for location tracking with semantic search

## Query Analysis

### Query 1: Create Table and Indexes (Line 19)
```javascript
const query = `
  CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    file_path TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    project VARCHAR(100),
    category VARCHAR(50),
    tags TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_locations_project ON locations(project);
  CREATE INDEX IF NOT EXISTS idx_locations_category ON locations(category);
  CREATE INDEX IF NOT EXISTS idx_locations_description ON locations(description);
`;
```
**Context**: `createTable` method  
**Purpose**: Initialize locations table with indexes  
**Parameters**: None  
**Returns**: Table creation confirmation

### Query 2: Add/Update Location (Line 44)
```javascript
const query = `
  INSERT INTO locations (file_path, description, project, category, tags)
  VALUES ($1, $2, $3, $4, $5)
  ON CONFLICT (file_path) 
  DO UPDATE SET 
    description = EXCLUDED.description,
    project = EXCLUDED.project,
    category = EXCLUDED.category,
    tags = EXCLUDED.tags,
    updated_at = NOW()
  RETURNING *
`;
```
**Context**: `addLocation` method  
**Purpose**: Insert or update location with conflict handling  
**Parameters**: `file_path`, `description`, `project`, `category`, `tags`  
**Returns**: Created/updated location record

### Query 3: Find and Update Access Time (Line 90)
```javascript
const query = `
  WITH matches AS (
    SELECT * FROM locations 
    WHERE 
      file_path ILIKE $1 OR
      description ILIKE $1 OR
      project ILIKE $1 OR
      category ILIKE $1 OR
      tags ILIKE $1
    ORDER BY last_accessed DESC, updated_at DESC
    LIMIT 20
  )
  UPDATE locations 
  SET last_accessed = NOW()
  WHERE id IN (SELECT id FROM matches)
  RETURNING *
`;
```
**Context**: `findLocations` method  
**Purpose**: Search and update access time in one query  
**Parameters**: `searchTerm` (with wildcards)  
**Returns**: Matching locations with updated access time

### Query 4: Batch Update Access Times (Line 115)
```javascript
const query = `
  UPDATE locations 
  SET last_accessed = NOW()
  WHERE file_path = ANY($1)
`;
```
**Context**: `updateAccessTimes` method  
**Purpose**: Update access times for multiple locations  
**Parameters**: `filePaths` (array)  
**Returns**: Update confirmation

### Query 5: Get Location by Path (Line 125)
```javascript
const query = `
  UPDATE locations 
  SET last_accessed = NOW()
  WHERE file_path = $1
  RETURNING *
`;
```
**Context**: `getLocationByPath` method  
**Purpose**: Get location and update access time  
**Parameters**: `filePath`  
**Returns**: Location record with updated access time

### Query 6: Get Recent Locations (Line 137)
```javascript
const query = `
  SELECT * FROM locations 
  ORDER BY last_accessed DESC
  LIMIT $1
`;
```
**Context**: `getRecentLocations` method  
**Purpose**: Get recently accessed locations  
**Parameters**: `limit`  
**Returns**: Recent location records

### Query 7: Get Locations by Project (Line 148)
```javascript
const query = `
  SELECT * FROM locations 
  WHERE project = $1
  ORDER BY category, file_path
`;
```
**Context**: `getLocationsByProject` method  
**Purpose**: Filter locations by project  
**Parameters**: `project`  
**Returns**: Project-specific locations

### Query 8: Get Locations by Category (Line 159)
```javascript
const query = `
  SELECT * FROM locations 
  WHERE category = $1
  ORDER BY project, file_path
`;
```
**Context**: `getLocationsByCategory` method  
**Purpose**: Filter locations by category  
**Parameters**: `category`  
**Returns**: Category-specific locations

### Query 9: Update Location Tags (Line 170)
```javascript
const query = `
  UPDATE locations 
  SET tags = $2, updated_at = NOW()
  WHERE file_path = $1
  RETURNING *
`;
```
**Context**: `updateLocationTags` method  
**Purpose**: Update tags for a location  
**Parameters**: `filePath`, `tags`  
**Returns**: Updated location record

### Query 10: Delete Location (Line 182)
```javascript
const query = 'DELETE FROM locations WHERE file_path = $1 RETURNING *';
```
**Context**: `deleteLocation` method  
**Purpose**: Remove location from tracking  
**Parameters**: `filePath`  
**Returns**: Deleted location record

### Query 11: Get Statistics (Line 188)
```javascript
const query = `
  SELECT 
    COUNT(*) as total_locations,
    COUNT(DISTINCT project) as total_projects,
    COUNT(DISTINCT category) as total_categories,
    MAX(updated_at) as last_update
  FROM locations
`;
```
**Context**: `getStats` method  
**Purpose**: Get location tracking statistics  
**Parameters**: None  
**Returns**: Aggregate statistics

## Proposed DatabaseAgent Methods

```javascript
// Location management operations
async createLocationsTable()
async upsertLocation(locationData)
async searchLocationsWithAccessUpdate(searchTerm)
async updateLocationAccessTimes(filePaths)
async getLocationByPath(filePath)
async getRecentLocations(limit = 10)
async getLocationsByProject(project)
async getLocationsByCategory(category)
async updateLocationTags(filePath, tags)
async deleteLocation(filePath)
async getLocationStats()
```

## Domain Classification
- **Primary**: Location Management
- **Secondary**: Access Tracking
- **Pattern**: Smart search with automatic access time updates

## Notes
- Automatic access time tracking on every read
- UPSERT pattern with ON CONFLICT for idempotent operations
- CTE (WITH clause) for atomic search and update
- Integrates with semantic search via SemanticLocationSearch
- Uses ANY($1) for efficient batch updates
- Case-insensitive search with ILIKE
- Comprehensive indexing for performance
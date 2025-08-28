/**
 * Schema Inspector - Database schema inspection and caching
 */

export class SchemaInspector {
  constructor(connector) {
    this.connector = connector;
    this.schemaCache = null;
    this.schemaCacheTime = null;
    this.cacheLifetime = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get complete database schema with caching
   */
  async getSchema(forceRefresh = false) {
    // Check cache first
    if (!forceRefresh && this.schemaCache && this.schemaCacheTime) {
      const cacheAge = Date.now() - this.schemaCacheTime;
      if (cacheAge < this.cacheLifetime) {
        console.log(`📋 Using cached schema (${Math.round(cacheAge/1000)}s old)`);
        return this.schemaCache;
      }
    }

    console.log('🔍 Fetching fresh database schema...');
    
    try {
      // Get all tables with their columns, types, and constraints
      const tablesQuery = `
        SELECT 
          t.table_schema,
          t.table_name,
          t.table_type,
          COALESCE(
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'column_name', c.column_name,
                'data_type', c.data_type,
                'is_nullable', c.is_nullable,
                'column_default', c.column_default,
                'character_maximum_length', c.character_maximum_length,
                'numeric_precision', c.numeric_precision
              ) ORDER BY c.ordinal_position
            ) FILTER (WHERE c.column_name IS NOT NULL),
            '[]'::json
          ) as columns
        FROM information_schema.tables t
        LEFT JOIN information_schema.columns c 
          ON t.table_schema = c.table_schema 
          AND t.table_name = c.table_name
        WHERE t.table_schema NOT IN ('information_schema', 'pg_catalog')
          AND t.table_type = 'BASE TABLE'
        GROUP BY t.table_schema, t.table_name, t.table_type
        ORDER BY t.table_schema, t.table_name
      `;

      const tablesResult = await this.connector.query(tablesQuery);
      
      // Get foreign key relationships
      const fkQuery = `
        SELECT 
          tc.table_schema, tc.table_name, tc.constraint_name,
          kcu.column_name, 
          ccu.table_schema AS foreign_table_schema,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name 
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
        ORDER BY tc.table_schema, tc.table_name, kcu.ordinal_position
      `;

      const fkResult = await this.connector.query(fkQuery);

      const schema = {
        tables: tablesResult.rows,
        foreign_keys: fkResult.rows,
        cached_at: new Date().toISOString(),
        total_tables: tablesResult.rows.length
      };

      // Cache the result
      this.schemaCache = schema;
      this.schemaCacheTime = Date.now();
      
      console.log(`✅ Schema loaded: ${schema.total_tables} tables`);
      return schema;
      
    } catch (error) {
      console.error('❌ Error fetching schema:', error.message);
      throw error;
    }
  }

  /**
   * Find a table by name (case-insensitive search across all schemas)
   */
  async findTable(tableName) {
    const schema = await this.getSchema();
    const searchName = tableName.toLowerCase();
    
    const matches = schema.tables.filter(table => 
      table.table_name.toLowerCase().includes(searchName) ||
      `${table.table_schema}.${table.table_name}`.toLowerCase().includes(searchName)
    );
    
    if (matches.length === 0) {
      return {
        found: false,
        message: `No tables found matching '${tableName}'`,
        suggestions: schema.tables
          .map(t => `${t.table_schema}.${t.table_name}`)
          .filter(name => name.toLowerCase().includes(searchName.substring(0, 3)))
          .slice(0, 5)
      };
    }
    
    return {
      found: true,
      matches: matches,
      exact_match: matches.find(t => t.table_name.toLowerCase() === searchName)
    };
  }
}
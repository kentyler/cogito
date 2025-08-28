/**
 * Schema Validator - Enforces schema checking before database operations
 * 
 * USAGE: Always call validateSchema() before writing any SQL
 * This will throw an error if schema hasn't been checked first
 */

export class SchemaValidator {
  constructor(connector) {
    this.connector = connector;
    this.schemaCache = new Map();
    this.lastCheck = null;
    this.checkRequired = true;
  }

  /**
   * MUST BE CALLED FIRST - Gets schema for a table
   * @param {string} schemaName - Schema name (e.g., 'games', 'meetings')
   * @param {string} tableName - Table name (e.g., 'client_games', 'turns')
   */
  async getTableSchema(schemaName, tableName) {
    const cacheKey = `${schemaName}.${tableName}`;
    
    // Check cache first (5 minute TTL)
    if (this.schemaCache.has(cacheKey)) {
      const cached = this.schemaCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
        this.lastCheck = Date.now();
        return cached.schema;
      }
    }

    const query = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = $1 AND table_name = $2
      ORDER BY ordinal_position
    `;

    const result = await this.connector.query(query, [schemaName, tableName]);
    
    if (result.rows.length === 0) {
      throw new Error(`Table ${schemaName}.${tableName} not found`);
    }

    const schema = {
      schemaName,
      tableName,
      columns: result.rows,
      checkedAt: new Date().toISOString()
    };

    this.schemaCache.set(cacheKey, {
      schema,
      timestamp: Date.now()
    });

    this.lastCheck = Date.now();
    console.log(`✅ Schema verified for ${schemaName}.${tableName}:`, 
      result.rows.map(r => r.column_name).join(', '));
    
    return schema;
  }

  /**
   * Validates that schema was checked recently
   * @throws {Error} if schema wasn't checked in last 30 seconds
   */
  validateSchemaWasChecked() {
    if (!this.checkRequired) return true;
    
    if (!this.lastCheck || Date.now() - this.lastCheck > 30000) {
      throw new Error(
        '❌ SCHEMA CHECK REQUIRED: You must call getTableSchema() before writing SQL!\n' +
        '   This prevents guessing at table/column names.\n' +
        '   Example: await schemaValidator.getTableSchema("games", "client_games")'
      );
    }
    return true;
  }

  /**
   * Lists all available schemas and tables
   */
  async listAllTables() {
    const query = `
      SELECT 
        table_schema,
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns c 
         WHERE c.table_schema = t.table_schema 
         AND c.table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY table_schema, table_name
    `;

    const result = await this.connector.query(query);
    this.lastCheck = Date.now();
    
    console.log('📊 Available tables:');
    result.rows.forEach(row => {
      console.log(`  ${row.table_schema}.${row.table_name} (${row.column_count} columns)`);
    });
    
    return result.rows;
  }

  /**
   * Builds a validated INSERT query
   */
  buildInsertQuery(schemaName, tableName, data) {
    this.validateSchemaWasChecked();
    
    const cacheKey = `${schemaName}.${tableName}`;
    if (!this.schemaCache.has(cacheKey)) {
      throw new Error(`Schema not checked for ${schemaName}.${tableName}`);
    }

    const schema = this.schemaCache.get(cacheKey).schema;
    const validColumns = schema.columns.map(c => c.column_name);
    
    // Filter data to only include valid columns
    const columns = [];
    const values = [];
    const placeholders = [];
    let paramIndex = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (validColumns.includes(key)) {
        columns.push(key);
        values.push(value);
        placeholders.push(`$${paramIndex++}`);
      } else {
        console.warn(`⚠️  Ignoring invalid column: ${key}`);
      }
    });

    const query = `
      INSERT INTO ${schemaName}.${tableName} (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;

    return { query, values };
  }
}

/**
 * Example usage pattern that MUST be followed:
 * 
 * const validator = new SchemaValidator(connector);
 * 
 * // STEP 1: Always check schema first
 * await validator.getTableSchema('games', 'client_games');
 * 
 * // STEP 2: Now you can write SQL with confidence
 * const { query, values } = validator.buildInsertQuery('games', 'client_games', {
 *   client_id: 101,
 *   name: 'my game',
 *   game_data: { ... }
 * });
 */
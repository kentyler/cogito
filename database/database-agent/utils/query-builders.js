/**
 * Query Builders - Builds INSERT and UPDATE queries with schema validation
 */

export class QueryBuilders {
  constructor(tableVerifier) {
    this.tableVerifier = tableVerifier;
  }

  /**
   * STEP 2: Build INSERT query with verified schema
   */
  async buildInsert(schemaName, tableName, data) {
    const fullName = `${schemaName}.${tableName}`;
    
    // Ensure table was verified
    const table = this.tableVerifier.getVerifiedTable(schemaName, tableName);
    if (!table) {
      throw new Error(
        `❌ Table ${fullName} not verified!\n` +
        `You MUST call verifyTable('${schemaName}', '${tableName}') first!`
      );
    }
    
    const validColumns = table.columns.map(c => c.column_name);
    
    // Build query with only valid columns
    const columns = [];
    const values = [];
    const placeholders = [];
    const skipped = [];
    let paramIndex = 1;
    
    for (const [key, value] of Object.entries(data)) {
      if (validColumns.includes(key)) {
        columns.push(key);
        values.push(value);
        placeholders.push(`$${paramIndex++}`);
      } else {
        skipped.push(key);
      }
    }
    
    if (skipped.length > 0) {
      console.warn(`⚠️  Skipped invalid columns: ${skipped.join(', ')}`);
      console.warn(`   Valid columns are: ${validColumns.join(', ')}`);
    }
    
    const query = `
      INSERT INTO ${fullName} (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;
    
    return { query, values, skippedColumns: skipped };
  }

  /**
   * STEP 2: Build UPDATE query with verified schema
   */
  async buildUpdate(schemaName, tableName, whereClause, data) {
    const fullName = `${schemaName}.${tableName}`;
    
    const table = this.tableVerifier.getVerifiedTable(schemaName, tableName);
    if (!table) {
      throw new Error(
        `❌ Table ${fullName} not verified!\n` +
        `You MUST call verifyTable('${schemaName}', '${tableName}') first!`
      );
    }
    
    const validColumns = table.columns.map(c => c.column_name);
    
    const setClauses = [];
    const values = [];
    const skipped = [];
    let paramIndex = 1;
    
    for (const [key, value] of Object.entries(data)) {
      if (validColumns.includes(key)) {
        setClauses.push(`${key} = $${paramIndex++}`);
        values.push(value);
      } else {
        skipped.push(key);
      }
    }
    
    if (skipped.length > 0) {
      console.warn(`⚠️  Skipped invalid columns: ${skipped.join(', ')}`);
    }
    
    const query = `
      UPDATE ${fullName}
      SET ${setClauses.join(', ')}
      WHERE ${whereClause}
      RETURNING *
    `;
    
    return { query, values, skippedColumns: skipped };
  }
}
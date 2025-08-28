/**
 * Table Verifier - Handles table verification and schema validation
 */

export class TableVerifier {
  constructor(schemaInspector) {
    this.schemaInspector = schemaInspector;
    this.verifiedTables = new Map(); // Cache verified schemas
    this.lastVerification = null;
  }

  /**
   * STEP 1: MUST BE CALLED FIRST - Verify table exists and get its schema
   * @param {string} schemaName - e.g., 'games', 'meetings', 'conversation'
   * @param {string} tableName - e.g., 'client_games', 'turns', 'sessions'
   */
  async verifyTable(schemaName, tableName) {
    const fullName = `${schemaName}.${tableName}`;
    
    // Get fresh schema
    const schema = await this.schemaInspector.getSchema();
    
    // Find the table
    const table = schema.tables.find(t => 
      t.table_schema === schemaName && t.table_name === tableName
    );
    
    if (!table) {
      // Provide helpful suggestions
      const similarTables = schema.tables
        .filter(t => t.table_schema === schemaName)
        .map(t => `  - ${t.table_schema}.${t.table_name}`)
        .join('\n');
      
      throw new Error(
        `❌ Table ${fullName} does not exist!\n` +
        `Available tables in ${schemaName} schema:\n${similarTables || '  (none)'}\n` +
        `\nTip: Check the exact table name with: await dbAgent.schema.listTables('${schemaName}')`
      );
    }
    
    // Cache the verified table
    this.verifiedTables.set(fullName, table);
    this.lastVerification = Date.now();
    
    console.log(`✅ Verified table: ${fullName}`);
    console.log(`   Columns: ${table.columns.map(c => c.column_name).join(', ')}`);
    
    return table;
  }

  /**
   * Get a verified table from cache
   */
  getVerifiedTable(schemaName, tableName) {
    const fullName = `${schemaName}.${tableName}`;
    return this.verifiedTables.get(fullName);
  }

  /**
   * Clear verification cache
   */
  clearCache() {
    this.verifiedTables.clear();
    this.lastVerification = null;
    console.log('🗑️ Query builder cache cleared');
  }
}
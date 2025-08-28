/**
 * Table Lister - Provides helpful table listing utilities
 */

export class TableLister {
  constructor(schemaInspector) {
    this.schemaInspector = schemaInspector;
  }

  /**
   * Helper: List all tables in a schema
   */
  async listTables(schemaName = null) {
    const schema = await this.schemaInspector.getSchema();
    
    if (schemaName) {
      const tables = schema.tables
        .filter(t => t.table_schema === schemaName)
        .map(t => ({
          name: t.table_name,
          columns: t.columns.length,
          columnList: t.columns.map(c => c.column_name).join(', ')
        }));
      
      console.log(`📊 Tables in ${schemaName} schema:`);
      tables.forEach(t => {
        console.log(`  - ${t.name} (${t.columns} columns)`);
        console.log(`    Columns: ${t.columnList}`);
      });
      
      return tables;
    } else {
      // List all schemas
      const schemas = [...new Set(schema.tables.map(t => t.table_schema))];
      console.log('📊 Available schemas:', schemas.join(', '));
      return schemas;
    }
  }
}
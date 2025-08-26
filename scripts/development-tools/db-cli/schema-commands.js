/**
 * Schema Commands - Handle database schema inspection
 */

export class SchemaCommands {
  constructor(dbAgent) {
    this.dbAgent = dbAgent;
  }

  /**
   * Show database schema information
   * @param {string} tableName - Optional specific table name
   */
  async showSchema(tableName) {
    if (tableName) {
      // Show specific table
      const table = await this.dbAgent.findTable(tableName);
      if (table) {
        console.log(`\n📋 Table: ${table.schema}.${table.name}`);
        console.log('Columns:');
        table.columns.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
        });
      } else {
        console.log(`Table "${tableName}" not found`);
      }
    } else {
      // Show all schemas and tables
      const schema = await this.dbAgent.getSchema();
      console.log('\n📁 Database Schemas:', schema.schemas.join(', '));
      console.log('\n📊 Tables:');
      
      let currentSchema = '';
      Object.values(schema.tables).forEach(table => {
        if (table.schema !== currentSchema) {
          currentSchema = table.schema;
          console.log(`\n${currentSchema}:`);
        }
        console.log(`  - ${table.name} (${table.columns.length} columns)`);
      });
      
      console.log('\n🔧 Functions:', schema.functions.length);
    }
  }
}
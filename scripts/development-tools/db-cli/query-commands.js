/**
 * Query Commands - Handle direct SQL queries and database testing
 */

export class QueryCommands {
  constructor(dbAgent) {
    this.dbAgent = dbAgent;
  }

  /**
   * Run a direct SQL query
   * @param {string} sql - SQL query to execute
   */
  async runQuery(sql) {
    if (!sql) {
      console.error('Please provide a SQL query');
      return;
    }
    
    console.log(`\n🔍 Running query: ${sql}`);
    
    const result = await this.dbAgent.query(sql);
    
    console.log(`\n✅ Query completed (${result.rows.length} rows):`);
    
    if (result.rows.length > 0) {
      // Show results in table format
      const columns = Object.keys(result.rows[0]);
      console.log('\n' + columns.join(' | '));
      console.log('-'.repeat(columns.join(' | ').length));
      
      result.rows.slice(0, 10).forEach(row => {
        console.log(columns.map(col => String(row[col] || '').substring(0, 50)).join(' | '));
      });
      
      if (result.rows.length > 10) {
        console.log(`\n... and ${result.rows.length - 10} more rows`);
      }
    }
  }

  /**
   * Test database connection
   */
  async testConnection() {
    console.log('🧪 Testing database connection...');
    await this.dbAgent.connect();
    const result = await this.dbAgent.query('SELECT current_database(), current_user, version()');
    
    console.log('\n✅ Connection successful!');
    console.log(`  Database: ${result.rows[0].current_database}`);
    console.log(`  User: ${result.rows[0].current_user}`);
    console.log(`  Version: ${result.rows[0].version.split(',')[0]}`);
  }
}
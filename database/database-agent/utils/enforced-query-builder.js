/**
 * Enforced Query Builder - Forces schema checking before SQL operations
 * 
 * PROBLEM: We keep guessing at table/field names and failing
 * SOLUTION: This builder REQUIRES schema lookup before building queries
 */

import { TableVerifier } from './table-verifier.js';
import { QueryBuilders } from './query-builders.js';
import { TableLister } from './table-lister.js';

export class EnforcedQueryBuilder {
  constructor(schemaInspector) {
    this.schemaInspector = schemaInspector;
    this.tableVerifier = new TableVerifier(schemaInspector);
    this.queryBuilders = new QueryBuilders(this.tableVerifier);
    this.tableLister = new TableLister(schemaInspector);
  }

  /**
   * STEP 1: MUST BE CALLED FIRST - Verify table exists and get its schema
   * @param {string} schemaName - e.g., 'games', 'meetings', 'conversation'
   * @param {string} tableName - e.g., 'client_games', 'turns', 'sessions'
   */
  async verifyTable(schemaName, tableName) {
    return this.tableVerifier.verifyTable(schemaName, tableName);
  }

  /**
   * STEP 2: Build INSERT query with verified schema
   */
  async buildInsert(schemaName, tableName, data) {
    return this.queryBuilders.buildInsert(schemaName, tableName, data);
  }

  /**
   * STEP 2: Build UPDATE query with verified schema
   */
  async buildUpdate(schemaName, tableName, whereClause, data) {
    return this.queryBuilders.buildUpdate(schemaName, tableName, whereClause, data);
  }

  /**
   * Helper: List all tables in a schema
   */
  async listTables(schemaName = null) {
    return this.tableLister.listTables(schemaName);
  }

  /**
   * Clear cache (useful after schema changes)
   */
  clearCache() {
    this.tableVerifier.clearCache();
  }
}

/**
 * USAGE EXAMPLE - This pattern MUST be followed:
 * 
 * const dbAgent = new DatabaseAgent();
 * const queryBuilder = new EnforcedQueryBuilder(dbAgent.schemaInspector);
 * 
 * // STEP 1: Always verify table first (will error if wrong)
 * await queryBuilder.verifyTable('games', 'client_games');
 * 
 * // STEP 2: Now build your query with confidence
 * const { query, values } = await queryBuilder.buildInsert('games', 'client_games', {
 *   client_id: 101,
 *   name: 'my game',
 *   game_data: { ... }
 * });
 * 
 * // STEP 3: Execute the query
 * await dbAgent.connector.query(query, values);
 */
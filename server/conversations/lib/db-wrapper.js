/**
 * Database wrapper utility to reduce boilerplate in conversation operations
 */

import { DatabaseAgent } from '#database/database-agent.js';

/**
 * Execute a database operation with automatic connection management
 * @param {Function} operation - Async function that receives dbAgent
 * @param {*} fallback - Value to return on error
 * @returns {Promise<*>} Result of operation or fallback value
 */
export async function withDbAgent(operation, fallback = null) {
  const dbAgent = new DatabaseAgent();
  try {
    await dbAgent.connect();
    const result = await operation(dbAgent);
    await dbAgent.close();
    return result;
  } catch (error) {
    console.error('Database operation error:', error);
    if (dbAgent.connector && dbAgent.connector.pool) {
      await dbAgent.close();
    }
    return fallback;
  }
}
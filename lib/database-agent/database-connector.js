/**
 * Database Connector - Core connection and query operations
 */

import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the correct location
dotenv.config({ path: path.join(__dirname, '../../.env') });

export class DatabaseConnector {
  constructor() {
    this.pool = null;
  }

  /**
   * Initialize connection using the correct connection string
   */
  async connect() {
    if (this.pool) return this.pool;

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL not found in environment variables');
    }

    console.log('🔌 Connecting to database...');
    
    this.pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      acquireTimeoutMillis: 10000,
    });

    // Test the connection
    try {
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      console.log('✅ Database connection successful');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      throw error;
    }

    return this.pool;
  }

  /**
   * Execute a query with parameters
   */
  async query(sql, params = []) {
    await this.connect();
    
    try {
      const start = Date.now();
      const result = await this.pool.query(sql, params);
      const duration = Date.now() - start;
      
      console.log(`📊 Query executed in ${duration}ms: ${sql.substring(0, 50)}...`);
      return result;
    } catch (error) {
      console.error('❌ Query error:', error.message);
      console.error('   SQL:', sql);
      console.error('   Params:', params);
      throw error;
    }
  }

  /**
   * Execute multiple queries in a transaction
   */
  async transaction(callback) {
    await this.connect();
    
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Transaction rolled back:', error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Close all connections
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      console.log('🔒 Database connections closed');
    }
  }
}
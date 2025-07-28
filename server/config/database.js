import { Pool } from 'pg';

// Initialize PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Set search path for schema access
pool.on('connect', (client) => {
  client.query('SET search_path = public, context, meetings, client_mgmt');
});

// Test connection
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    client.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

// Middleware to add database pool to requests
export const databaseMiddleware = (req, res, next) => {
  req.db = pool;
  next();
};

// Initialize database (alias for testConnection + return pool)
export async function initializeDatabase() {
  await testConnection();
  return pool;
}

export { pool, testConnection, databaseMiddleware };
export default pool;
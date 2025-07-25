/**
 * Database Agent - Intelligent database operations handler
 * 
 * Solves key problems:
 * 1. Always uses correct connection string from .env
 * 2. Queries live schema instead of guessing from migrations
 * 3. Handles transcript processing and investigation
 * 4. Provides consistent interface for all database operations
 */

import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the correct location
dotenv.config({ path: path.join(__dirname, '../conversational-repl/.env') });

export class DatabaseAgent {
  constructor() {
    this.pool = null;
    this.schemaCache = null;
    this.schemaCacheTime = null;
    this.cacheLifetime = 5 * 60 * 1000; // 5 minutes
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
    });

    // Test connection
    try {
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      throw error;
    }

    return this.pool;
  }

  /**
   * Get live schema information from the database
   */
  async getSchema(forceRefresh = false) {
    if (!forceRefresh && this.schemaCache && 
        (Date.now() - this.schemaCacheTime) < this.cacheLifetime) {
      return this.schemaCache;
    }

    await this.connect();
    
    const schema = {
      schemas: [],
      tables: {},
      functions: [],
      views: []
    };

    // Get all schemas
    const schemas = await this.pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
      ORDER BY schema_name
    `);
    schema.schemas = schemas.rows.map(r => r.schema_name);

    // Get all tables with columns
    const tables = await this.pool.query(`
      SELECT 
        t.table_schema,
        t.table_name,
        array_agg(
          json_build_object(
            'column_name', c.column_name,
            'data_type', c.data_type,
            'is_nullable', c.is_nullable,
            'column_default', c.column_default
          ) ORDER BY c.ordinal_position
        ) as columns
      FROM information_schema.tables t
      JOIN information_schema.columns c ON t.table_schema = c.table_schema AND t.table_name = c.table_name
      WHERE t.table_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
      GROUP BY t.table_schema, t.table_name
      ORDER BY t.table_schema, t.table_name
    `);

    tables.rows.forEach(row => {
      const key = `${row.table_schema}.${row.table_name}`;
      schema.tables[key] = {
        schema: row.table_schema,
        name: row.table_name,
        columns: row.columns
      };
    });

    // Get functions
    const functions = await this.pool.query(`
      SELECT 
        routine_schema,
        routine_name,
        routine_type
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      ORDER BY routine_name
    `);
    schema.functions = functions.rows;

    this.schemaCache = schema;
    this.schemaCacheTime = Date.now();
    
    return schema;
  }

  /**
   * Find table by name (searches all schemas)
   */
  async findTable(tableName) {
    const schema = await this.getSchema();
    
    // Search for exact match first
    for (const [key, table] of Object.entries(schema.tables)) {
      if (table.name === tableName) {
        return table;
      }
    }
    
    // Search for partial match
    for (const [key, table] of Object.entries(schema.tables)) {
      if (table.name.includes(tableName)) {
        return table;
      }
    }
    
    return null;
  }

  /**
   * Execute a query with proper error handling
   */
  async query(sql, params = []) {
    await this.connect();
    try {
      const result = await this.pool.query(sql, params);
      return result;
    } catch (error) {
      console.error('Query error:', error.message);
      console.error('SQL:', sql);
      console.error('Params:', params);
      throw error;
    }
  }

  /**
   * Execute a transaction
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
      throw error;
    } finally {
      client.release();
    }
  }

  // ==========================================
  // TRANSCRIPT OPERATIONS
  // ==========================================

  /**
   * Get meeting transcripts with optional filters
   */
  async getMeetingTranscripts(options = {}) {
    const { meetingId, participantId, startDate, endDate, limit = 100 } = options;
    
    let sql = `
      SELECT 
        t.turn_id,
        t.content,
        t.timestamp,
        p.name as participant_name,
        p.email as participant_email,
        bm.meeting_id,
        bm.meeting_title,
        b.name as block_name
      FROM conversation.turns t
      JOIN conversation.participants p ON t.participant_id = p.id
      LEFT JOIN conversation.block_turns bt ON t.turn_id = bt.turn_id
      LEFT JOIN conversation.blocks b ON bt.block_id = b.block_id
      LEFT JOIN conversation.block_meetings bm ON b.block_id = bm.block_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;

    if (meetingId) {
      sql += ` AND bm.meeting_id = $${++paramCount}`;
      params.push(meetingId);
    }
    
    if (participantId) {
      sql += ` AND t.participant_id = $${++paramCount}`;
      params.push(participantId);
    }
    
    if (startDate) {
      sql += ` AND t.timestamp >= $${++paramCount}`;
      params.push(startDate);
    }
    
    if (endDate) {
      sql += ` AND t.timestamp <= $${++paramCount}`;
      params.push(endDate);
    }
    
    sql += ` ORDER BY t.timestamp DESC LIMIT $${++paramCount}`;
    params.push(limit);
    
    const result = await this.query(sql, params);
    return result.rows;
  }

  /**
   * Process and import a transcript file
   */
  async importTranscript(options) {
    const { 
      filePath, 
      meetingTitle, 
      meetingId, 
      clientId = 6, // Default to Cogito
      parseFunction 
    } = options;

    // Read and parse the transcript
    const content = await fs.readFile(filePath, 'utf-8');
    const turns = parseFunction ? parseFunction(content) : this.parseBasicTranscript(content);

    return await this.transaction(async (client) => {
      // Create a block for this transcript
      const blockResult = await client.query(`
        INSERT INTO conversation.blocks (name, block_type, metadata, client_id)
        VALUES ($1, 'transcript_import', $2, $3)
        RETURNING block_id
      `, [
        meetingTitle || `Imported Transcript ${new Date().toISOString()}`,
        { 
          source_file: filePath,
          imported_at: new Date().toISOString(),
          meeting_id: meetingId 
        },
        clientId
      ]);
      
      const blockId = blockResult.rows[0].block_id;

      // If meetingId provided, create block_meetings entry
      if (meetingId) {
        await client.query(`
          INSERT INTO conversation.block_meetings (block_id, meeting_id, meeting_title)
          VALUES ($1, $2, $3)
        `, [blockId, meetingId, meetingTitle]);
      }

      // Process each turn
      let sequenceOrder = 1;
      for (const turn of turns) {
        // Find or create participant
        let participantId;
        if (turn.participantEmail) {
          const pResult = await client.query(
            `SELECT find_participant_id($1)`,
            [turn.participantEmail]
          );
          participantId = pResult.rows[0].find_participant_id;
        }
        
        if (!participantId && turn.participantName) {
          // Create new participant if not found
          const createResult = await client.query(`
            INSERT INTO conversation.participants (name, email, type)
            VALUES ($1, $2, 'human')
            RETURNING id
          `, [turn.participantName, turn.participantEmail]);
          participantId = createResult.rows[0].id;
        }

        // Insert turn
        const turnResult = await client.query(`
          INSERT INTO conversation.turns (
            participant_id, content, source_type, metadata, timestamp, client_id
          ) VALUES ($1, $2, 'transcript_import', $3, $4, $5)
          RETURNING turn_id
        `, [
          participantId,
          turn.content,
          { original_timestamp: turn.timestamp },
          turn.timestamp || new Date(),
          clientId
        ]);

        // Link turn to block
        await client.query(`
          INSERT INTO conversation.block_turns (block_id, turn_id, sequence_order)
          VALUES ($1, $2, $3)
        `, [blockId, turnResult.rows[0].turn_id, sequenceOrder++]);
      }

      return {
        blockId,
        turnsImported: turns.length,
        meetingId
      };
    });
  }

  /**
   * Basic transcript parser (can be overridden)
   */
  parseBasicTranscript(content) {
    const lines = content.split('\n');
    const turns = [];
    let currentSpeaker = null;
    let currentContent = [];

    for (const line of lines) {
      // Simple format: "Speaker Name: content"
      const speakerMatch = line.match(/^([^:]+):\s*(.*)$/);
      
      if (speakerMatch) {
        // Save previous turn if exists
        if (currentSpeaker && currentContent.length > 0) {
          turns.push({
            participantName: currentSpeaker,
            content: currentContent.join('\n').trim(),
            timestamp: new Date()
          });
        }
        
        currentSpeaker = speakerMatch[1].trim();
        currentContent = [speakerMatch[2]];
      } else if (currentSpeaker && line.trim()) {
        // Continuation of current speaker
        currentContent.push(line);
      }
    }

    // Don't forget the last turn
    if (currentSpeaker && currentContent.length > 0) {
      turns.push({
        participantName: currentSpeaker,
        content: currentContent.join('\n').trim(),
        timestamp: new Date()
      });
    }

    return turns;
  }

  /**
   * Analyze transcript patterns
   */
  async analyzeTranscript(blockId) {
    // Get all turns in the block
    const turns = await this.query(`
      SELECT 
        t.content,
        t.timestamp,
        p.name as participant_name,
        p.patterns
      FROM conversation.turns t
      JOIN conversation.participants p ON t.participant_id = p.id
      JOIN conversation.block_turns bt ON t.turn_id = bt.turn_id
      WHERE bt.block_id = $1
      ORDER BY bt.sequence_order
    `, [blockId]);

    // Basic analysis
    const analysis = {
      totalTurns: turns.rows.length,
      participants: {},
      timeSpan: null,
      averageTurnLength: 0,
      patterns: []
    };

    let totalLength = 0;
    let minTime = null;
    let maxTime = null;

    for (const turn of turns.rows) {
      // Participant stats
      if (!analysis.participants[turn.participant_name]) {
        analysis.participants[turn.participant_name] = {
          turnCount: 0,
          totalWords: 0,
          patterns: turn.patterns || {}
        };
      }
      
      const wordCount = turn.content.split(/\s+/).length;
      analysis.participants[turn.participant_name].turnCount++;
      analysis.participants[turn.participant_name].totalWords += wordCount;
      totalLength += turn.content.length;

      // Time tracking
      const turnTime = new Date(turn.timestamp);
      if (!minTime || turnTime < minTime) minTime = turnTime;
      if (!maxTime || turnTime > maxTime) maxTime = turnTime;
    }

    analysis.averageTurnLength = Math.round(totalLength / turns.rows.length);
    analysis.timeSpan = minTime && maxTime ? {
      start: minTime,
      end: maxTime,
      durationMinutes: Math.round((maxTime - minTime) / 1000 / 60)
    } : null;

    return analysis;
  }

  /**
   * Search transcripts by content
   */
  async searchTranscripts(searchTerm, options = {}) {
    const { limit = 50, participantId, blockId } = options;
    
    let sql = `
      SELECT 
        t.turn_id,
        t.content,
        t.timestamp,
        p.name as participant_name,
        b.name as block_name,
        ts_rank(to_tsvector('english', t.content), plainto_tsquery('english', $1)) as rank
      FROM conversation.turns t
      JOIN conversation.participants p ON t.participant_id = p.id
      LEFT JOIN conversation.block_turns bt ON t.turn_id = bt.turn_id
      LEFT JOIN conversation.blocks b ON bt.block_id = b.block_id
      WHERE to_tsvector('english', t.content) @@ plainto_tsquery('english', $1)
    `;
    
    const params = [searchTerm];
    let paramCount = 1;

    if (participantId) {
      sql += ` AND t.participant_id = $${++paramCount}`;
      params.push(participantId);
    }
    
    if (blockId) {
      sql += ` AND bt.block_id = $${++paramCount}`;
      params.push(blockId);
    }
    
    sql += ` ORDER BY rank DESC LIMIT $${++paramCount}`;
    params.push(limit);
    
    const result = await this.query(sql, params);
    return result.rows;
  }

  /**
   * Get participant statistics
   */
  async getParticipantStats(participantId) {
    const stats = await this.query(`
      SELECT 
        p.name,
        p.email,
        p.patterns,
        COUNT(DISTINCT t.turn_id) as total_turns,
        COUNT(DISTINCT bt.block_id) as total_blocks,
        MIN(t.timestamp) as first_turn,
        MAX(t.timestamp) as last_turn,
        AVG(LENGTH(t.content)) as avg_turn_length
      FROM conversation.participants p
      LEFT JOIN conversation.turns t ON p.id = t.participant_id
      LEFT JOIN conversation.block_turns bt ON t.turn_id = bt.turn_id
      WHERE p.id = $1
      GROUP BY p.id, p.name, p.email, p.patterns
    `, [participantId]);

    return stats.rows[0];
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      console.log('🔌 Database connection closed');
    }
  }
}

// Export singleton instance
export const dbAgent = new DatabaseAgent();
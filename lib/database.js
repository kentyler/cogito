/**
 * Database Manager for Cogito Multi-Personality System
 * Handles all PostgreSQL operations with pg client
 */

import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class DatabaseManager {
  constructor(config = {}) {
    // PostgreSQL connection configuration
    // Use Supabase connection string (IPv4 pooler) if provided, otherwise fall back to local
    const supabaseUrl = process.env.SUPABASE_URL || 'postgresql://user:password@host/database';
    
    console.log('🔧 Attempting Supabase connection via IPv4 pooler...');
    
    if (process.env.USE_LOCAL_DB === 'true') {
      // Local database fallback
      this.pool = new Pool({
        host: config.host || process.env.POSTGRES_HOST || 'localhost',
        port: config.port || process.env.POSTGRES_PORT || 5432,
        database: config.database || process.env.POSTGRES_DB || 'cogito',
        user: config.user || process.env.POSTGRES_USER || 'ken',
        password: config.password || process.env.POSTGRES_PASSWORD || '7297',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
    } else {
      // Use Supabase connection
      this.pool = new Pool({
        connectionString: supabaseUrl,
        ssl: { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        acquireTimeoutMillis: 10000,
      });
    }

    // Test connection and initialize schema on creation (non-blocking)
    this.initialize().catch(err => {
      console.warn('⚠️  Initial connection test failed, will retry on demand:', err.message);
    });
  }

  async initialize() {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      // Set search path for all connections in the pool
      this.pool.on('connect', (client) => {
        client.query('SET search_path = public, conversation, client_mgmt');
      });
      
      console.log('✅ PostgreSQL connected successfully');
    } catch (err) {
      console.error('❌ PostgreSQL connection failed:', err.message);
      throw err;
    }
  }

  async testConnection() {
    return this.initialize();
  }

  // Personality management
  async getPersonality(collaborator, domain) {
    const query = `
      SELECT p.*, per.* FROM personalities per
      JOIN participants p ON p.id = per.participant_id 
      WHERE p.metadata->>'collaborator' = $1 AND per.domain = $2 AND per.status = 'active'
    `;
    
    const result = await this.pool.query(query, [collaborator, domain]);
    return result.rows[0] || null;
  }

  async getActivePersonalities(collaborator, domains = null) {
    let query = `
      SELECT p.*, per.* FROM personalities per
      JOIN participants p ON p.id = per.participant_id 
      WHERE p.metadata->>'collaborator' = $1 AND per.status = 'active'
    `;
    let params = [collaborator];
    
    if (domains && domains.length > 0) {
      const placeholders = domains.map((_, i) => `$${i + 2}`).join(',');
      query += ` AND per.domain IN (${placeholders})`;
      params = params.concat(domains);
    }
    
    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async createPersonality(personalityData) {
    // First create participant
    const participantQuery = `
      INSERT INTO participants (name, type, metadata)
      VALUES ($1, $2, $3)
      RETURNING id
    `;
    
    const participantResult = await this.pool.query(participantQuery, [
      personalityData.name,
      'ai_personality',
      {
        collaborator: personalityData.collaborator,
        created_from_base: personalityData.created_from_base
      }
    ]);
    
    const participantId = participantResult.rows[0].id;
    
    // Then create personality
    const personalityQuery = `
      INSERT INTO personalities 
      (participant_id, name, domain, specialization, current_config, personality_type, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;
    
    const personalityResult = await this.pool.query(personalityQuery, [
      participantId,
      personalityData.name,
      personalityData.domain,
      personalityData.specialization,
      personalityData.current_config,
      'cogito_personality',
      'active'
    ]);
    
    return { id: personalityResult.rows[0].id, participant_id: participantId };
  }

  // Interaction tracking - now using blocks/turns architecture
  async recordPublicInteraction(sessionId, collaborator, humanInput, interactionType = 'chat') {
    // Get participant ID for the collaborator (Ken = 3)
    const participantId = collaborator === 'ken' ? 3 : 2; // Default to Cogito System
    
    // Insert turn
    const turnQuery = `
      INSERT INTO turns 
      (participant_id, content, source_type, metadata)
      VALUES ($1, $2, $3, $4)
      RETURNING turn_id
    `;
    
    const turnResult = await this.pool.query(turnQuery, [
      participantId, 
      humanInput, 
      interactionType,
      { session_id: sessionId, original_source: 'public_interaction' }
    ]);
    
    const turnId = turnResult.rows[0].turn_id;
    
    // Find or create block for this session
    await this.ensureSessionBlock(sessionId, turnId);
    
    return { id: turnId };
  }

  async updatePublicInteraction(id, response, deliberationId) {
    const query = `
      UPDATE turns 
      SET content = content || '\n\nResponse: ' || $1,
          metadata = jsonb_set(metadata, '{deliberation_id}', $2::text::jsonb)
      WHERE turn_id = $3
    `;
    
    await this.pool.query(query, [response, deliberationId, id]);
  }
  
  // Helper method to ensure session has a block
  async ensureSessionBlock(sessionId, turnId) {
    // Check if block exists for this session
    const blockCheck = await this.pool.query(
      `SELECT block_id FROM blocks WHERE metadata->>'session_id' = $1 AND block_type = 'session'`,
      [sessionId]
    );
    
    let blockId;
    if (blockCheck.rows.length === 0) {
      // Create new block for session
      const blockResult = await this.pool.query(
        `INSERT INTO blocks (name, block_type, metadata) 
         VALUES ($1, 'session', $2) RETURNING block_id`,
        [`Session: ${sessionId}`, { session_id: sessionId, created_by: 'database_manager' }]
      );
      blockId = blockResult.rows[0].block_id;
    } else {
      blockId = blockCheck.rows[0].block_id;
    }
    
    // Get next sequence order for this block
    const sequenceResult = await this.pool.query(
      'SELECT COALESCE(MAX(sequence_order), 0) + 1 as next_order FROM block_turns WHERE block_id = $1',
      [blockId]
    );
    
    // Link turn to block
    await this.pool.query(
      'INSERT INTO block_turns (block_id, turn_id, sequence_order) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [blockId, turnId, sequenceResult.rows[0].next_order]
    );
  }

  // Deliberation tracking
  async recordDeliberation(deliberation) {
    const query = `
      INSERT INTO internal_deliberations 
      (public_interaction_id, session_id, participants, active_coordinator,
       input_analysis, initial_responses, conflicts_detected, evaporation_attempts,
       final_synthesis, insights_gained, new_patterns_detected)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `;
    
    const result = await this.pool.query(query, [
      deliberation.public_interaction_id,
      deliberation.session_id,
      deliberation.participants, // PostgreSQL handles arrays natively
      deliberation.active_coordinator,
      deliberation.input_analysis, // PostgreSQL handles JSONB natively
      deliberation.initial_responses,
      deliberation.conflicts_detected,
      deliberation.evaporation_attempts,
      deliberation.final_synthesis,
      deliberation.insights_gained,
      deliberation.new_patterns_detected
    ]);
    
    return { id: result.rows[0].id };
  }


  // Record thinking process
  async recordThinkingProcess(thinkingData) {
    const query = `
      INSERT INTO thinking_processes 
      (interaction_id, session_id, collaborator, process_type, trigger_context,
       reasoning_chain, concepts_connected, insights_generated, synthesis_achieved,
       confidence_level, complexity_level)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `;
    
    const result = await this.pool.query(query, [
      thinkingData.interaction_id,
      thinkingData.session_id,
      thinkingData.collaborator,
      thinkingData.process_type,
      thinkingData.trigger_context,
      thinkingData.reasoning_chain,
      thinkingData.concepts_connected,
      thinkingData.insights_generated || [],
      thinkingData.synthesis_achieved,
      thinkingData.confidence_level || 0.7,
      thinkingData.complexity_level || 'moderate'
    ]);
    
    return { id: result.rows[0].id };
  }

  // Record analytical insight
  async recordAnalyticalInsight(insightData) {
    const query = `
      INSERT INTO analytical_insights 
      (thinking_process_id, insight_type, insight_description, triggered_by,
       significance_level, actionable_implications, generalizable)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;
    
    const result = await this.pool.query(query, [
      insightData.thinking_process_id,
      insightData.insight_type,
      insightData.insight_description,
      insightData.triggered_by,
      insightData.significance_level,
      insightData.actionable_implications || [],
      insightData.generalizable || false
    ]);
    
    return { id: result.rows[0].id };
  }

  // Record concept connections
  async recordConceptConnection(connectionData) {
    const query = `
      INSERT INTO concept_connections 
      (thinking_process_id, concept_a, concept_b, connection_type,
       connection_strength, significance, supporting_evidence)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;
    
    const result = await this.pool.query(query, [
      connectionData.thinking_process_id,
      connectionData.concept_a,
      connectionData.concept_b,
      connectionData.connection_type,
      connectionData.connection_strength || 0.5,
      connectionData.significance,
      connectionData.supporting_evidence || []
    ]);
    
    return { id: result.rows[0].id };
  }

  // Complexity tracking - using participant metadata
  async updateComplexityIndicators(collaborator, updates) {
    // Get participant ID
    const participantId = collaborator === 'ken' ? 3 : 2;
    
    // Get current metadata
    const currentQuery = `SELECT metadata FROM participants WHERE id = $1`;
    const currentResult = await this.pool.query(currentQuery, [participantId]);
    const currentMetadata = currentResult.rows[0]?.metadata || {};
    
    // Update complexity data in metadata
    const complexity = currentMetadata.complexity || {
      conflicting_requests: 0,
      domain_switches_per_session: 0,
      evaporation_opportunities: 0,
      liminal_observations_backlog: 0
    };
    
    complexity.conflicting_requests += updates.conflictingRequests || 0;
    complexity.domain_switches_per_session = updates.domainSwitchesPerSession || complexity.domain_switches_per_session;
    complexity.evaporation_opportunities += updates.evaporationOpportunities || 0;
    complexity.liminal_observations_backlog += updates.liminalObservationsBacklog || 0;
    complexity.measured_at = new Date().toISOString();
    
    // Update participant metadata
    const updateQuery = `
      UPDATE participants 
      SET metadata = jsonb_set(metadata, '{complexity}', $1::jsonb)
      WHERE id = $2
    `;
    
    await this.pool.query(updateQuery, [JSON.stringify(complexity), participantId]);
  }

  async getComplexityIndicators(collaborator) {
    // Get participant ID
    const participantId = collaborator === 'ken' ? 3 : 2;
    
    const query = `SELECT metadata FROM participants WHERE id = $1`;
    const result = await this.pool.query(query, [participantId]);
    
    const metadata = result.rows[0]?.metadata || {};
    return metadata.complexity || {
      conflicting_requests: 0,
      domain_switches_per_session: 0,
      evaporation_opportunities: 0,
      liminal_observations_backlog: 0,
      measured_at: new Date().toISOString()
    };
  }

  // Evaporating cloud operations
  async createEvaporatingCloud(deliberationId, cloudData) {
    const query = `
      INSERT INTO evaporating_clouds 
      (deliberation_id, current_state_d_prime, desired_state_d,
       benefits_b, benefits_c, outcome_a)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;
    
    const result = await this.pool.query(query, [
      deliberationId,
      cloudData.currentState,
      cloudData.desiredState,
      cloudData.benefitsB, // PostgreSQL handles JSONB automatically
      cloudData.benefitsC,
      cloudData.outcomeA
    ]);
    
    return { id: result.rows[0].id };
  }

  async updateEvaporatingCloud(id, updates) {
    const fields = [];
    const values = [];
    let paramIndex = 1;
    
    // Build dynamic update query
    if (updates.undesirableEffects) {
      fields.push(`undesirable_effects = $${paramIndex++}`);
      values.push(updates.undesirableEffects);
    }
    if (updates.assumptionsIdentified) {
      fields.push(`assumptions_identified = $${paramIndex++}`);
      values.push(updates.assumptionsIdentified);
    }
    if (updates.vulnerableAssumption) {
      fields.push(`vulnerable_assumption = $${paramIndex++}`);
      values.push(updates.vulnerableAssumption);
    }
    if (updates.evaporationStrategy) {
      fields.push(`evaporation_strategy = $${paramIndex++}`);
      values.push(updates.evaporationStrategy);
    }
    if (updates.synthesisAchieved !== undefined) {
      fields.push(`synthesis_achieved = $${paramIndex++}`);
      values.push(updates.synthesisAchieved);
    }
    if (updates.newCapabilityEmerged) {
      fields.push(`new_capability_emerged = $${paramIndex++}`);
      values.push(updates.newCapabilityEmerged);
    }
    
    if (fields.length > 0) {
      values.push(id);
      const query = `
        UPDATE evaporating_clouds 
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex}
      `;
      await this.pool.query(query, values);
    }
  }

  // Learning and pattern detection
  async recordLearningPattern(conflictType, pattern, synthesis) {
    const query = `
      INSERT INTO evaporation_patterns 
      (conflict_type, pattern_description, successful_synthesis)
      VALUES ($1, $2, $3)
      RETURNING id
    `;
    
    const result = await this.pool.query(query, [
      conflictType,
      pattern,
      synthesis // PostgreSQL handles JSONB automatically
    ]);
    
    return { id: result.rows[0].id };
  }

  async findSimilarPatterns(conflictType) {
    const query = `
      SELECT * FROM evaporation_patterns 
      WHERE conflict_type = $1 
      ORDER BY reuse_count DESC, created_at DESC
      LIMIT 5
    `;
    
    const result = await this.pool.query(query, [conflictType]);
    return result.rows;
  }

  // Transaction support
  async transaction(fn) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // Close database connection
  async close() {
    await this.pool.end();
  }

  // View queries for common operations
  async getActivePersonalitiesView(collaborator) {
    const query = `SELECT * FROM active_personalities WHERE collaborator = $1`;
    const result = await this.pool.query(query, [collaborator]);
    return result.rows;
  }

  async getRecentDeliberations(collaborator = null, days = 7) {
    let query = `
      SELECT * FROM recent_deliberations 
      WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '${days} days'
    `;
    let params = [];
    
    if (collaborator) {
      query += ` AND collaborator = $1`;
      params = [collaborator];
    }
    
    query += ` ORDER BY created_at DESC`;
    
    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async getConflictResolutionPatterns(days = 30) {
    const query = `
      SELECT * FROM conflict_resolution_patterns
    `;
    
    const result = await this.pool.query(query);
    return result.rows;
  }

  // Query essay embeddings for discourse enrichment
  async queryEssayEmbeddings(queryEmbedding, limit = 5, similarityThreshold = 0.3) {
    const query = `
      SELECT 
        content_text,
        metadata,
        (1 - (content_vector <=> $1::vector)) as similarity
      FROM participant_topic_turns 
      WHERE topic_id = 3  -- Essays topic ID
        AND (1 - (content_vector <=> $1::vector)) >= $2
      ORDER BY similarity DESC
      LIMIT $3
    `;
    
    try {
      const result = await this.pool.query(query, [
        JSON.stringify(queryEmbedding),
        similarityThreshold,
        limit
      ]);
      return result.rows;
    } catch (error) {
      console.error('Error querying essay embeddings:', error);
      throw error;
    }
  }

  // Store personality evolution proposal
  async storePersonalityEvolution(collaborator, aspect, change, reasoning, context) {
    // Get participant ID for collaborator (Ken = 3, default to Cogito = 2)
    const participantId = collaborator === 'ken' ? 3 : 2;
    
    const query = `
      INSERT INTO personality_evolutions (
        participant_id, version, changes, reasoning, context, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id
    `;
    
    try {
      // Generate a version number based on existing evolutions
      const versionResult = await this.pool.query(
        'SELECT COUNT(*) + 1 as next_version FROM personality_evolutions WHERE participant_id = $1',
        [participantId]
      );
      
      const result = await this.pool.query(query, [
        participantId,
        'v0.' + versionResult.rows[0].next_version + '.0',
        aspect + ': ' + JSON.stringify(change),
        reasoning,
        context
      ]);
      return result.rows[0].id;
    } catch (error) {
      console.error('Personality evolution storage error:', error);
      throw error;
    }
  }

  // Create personality evolutions table if it doesn't exist
  async createPersonalityEvolutionsTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS personality_evolutions (
        id SERIAL PRIMARY KEY,
        collaborator VARCHAR(100) NOT NULL,
        aspect VARCHAR(100) NOT NULL,
        change_data JSONB NOT NULL,
        reasoning TEXT NOT NULL,
        context TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        applied BOOLEAN DEFAULT FALSE,
        applied_at TIMESTAMP WITH TIME ZONE
      );
      
      CREATE INDEX IF NOT EXISTS idx_personality_evolutions_collaborator 
      ON personality_evolutions(collaborator);
      
      CREATE INDEX IF NOT EXISTS idx_personality_evolutions_aspect 
      ON personality_evolutions(aspect);
    `;
    
    await this.pool.query(query);
    console.log('✅ Created personality_evolutions table');
  }
}
/**
 * Stop Hook Processor - Extracted from claude-stop-hook.js to meet file size requirements
 * Handles fragment extraction and database operations for hook processing
 */

import { Pool } from 'pg';
import { FragmentExtractionAgent } from '#ai-agents/fragment-extraction-agent.js';
import { v4 as uuidv4 } from 'uuid';

export class StopHookProcessor {
  constructor(databaseUrl) {
    this.pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });
    this.debugLog = [];
  }

  async processSessionTurns(sessionId, clientId, userMessage, agentResponse) {
    this.debugLog.push(`🔄 Processing turns for session ${sessionId}`);

    const fragmentAgent = new FragmentExtractionAgent(this.pool);
    await fragmentAgent.connect();

    try {
      // Create user turn
      const userTurnId = await this.createTurn(clientId, sessionId, userMessage, 'user');
      this.debugLog.push(`📝 Created user turn: ${userTurnId}`);

      // Create Claude response turn
      const claudeTurnId = await this.createTurn(clientId, sessionId, agentResponse, 'llm');
      this.debugLog.push(`📝 Created Claude turn: ${claudeTurnId}`);

      // Process user turn for fragments
      const userFragmentResult = await fragmentAgent.processTurn(
        clientId,
        sessionId,
        userTurnId,
        userMessage
      );

      if (userFragmentResult.success) {
        this.debugLog.push(`✅ Extracted ${userFragmentResult.fragmentCount} fragments from user turn`);
      } else {
        this.debugLog.push(`⚠️ Fragment extraction failed for user turn: ${userFragmentResult.error}`);
      }

      // Process Claude response for fragments
      const claudeFragmentResult = await fragmentAgent.processTurn(
        clientId,
        sessionId,
        claudeTurnId,
        agentResponse
      );

      if (claudeFragmentResult.success) {
        this.debugLog.push(`✅ Extracted ${claudeFragmentResult.fragmentCount} fragments from Claude response`);
      } else {
        this.debugLog.push(`⚠️ Fragment extraction failed for Claude response: ${claudeFragmentResult.error}`);
      }

      return {
        success: true,
        userTurnId,
        claudeTurnId,
        userFragments: userFragmentResult.fragmentCount || 0,
        claudeFragments: claudeFragmentResult.fragmentCount || 0
      };

    } catch (error) {
      this.debugLog.push(`❌ Error processing session turns: ${error.message}`);
      throw error;
    } finally {
      await fragmentAgent.close();
    }
  }

  async createTurn(clientId, sessionId, content, sourceType) {
    const turnId = uuidv4();
    const query = `
      INSERT INTO conversation.turns (id, session_id, content, source_type, metadata)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;

    const metadata = {
      client_id: clientId,
      hook_event: 'claude-stop-hook',
      timestamp: new Date().toISOString()
    };

    const result = await this.pool.query(query, [
      turnId,
      sessionId,
      content,
      sourceType,
      JSON.stringify(metadata)
    ]);

    return result.rows[0].id;
  }

  async createSessionIfNeeded(sessionId, clientId) {
    // Check if session exists
    const sessionQuery = 'SELECT id FROM conversation.sessions WHERE id = $1';
    const sessionResult = await this.pool.query(sessionQuery, [sessionId]);

    if (sessionResult.rows.length === 0) {
      // Create new session
      const createSessionQuery = `
        INSERT INTO conversation.sessions (id, client_id, session_type, metadata)
        VALUES ($1, $2, 'claude_hook', $3)
        RETURNING id
      `;

      const metadata = {
        created_by: 'claude-stop-hook',
        created_at: new Date().toISOString()
      };

      await this.pool.query(createSessionQuery, [
        sessionId,
        clientId,
        JSON.stringify(metadata)
      ]);

      this.debugLog.push(`🆕 Created new session: ${sessionId}`);
    } else {
      this.debugLog.push(`✅ Session exists: ${sessionId}`);
    }
  }

  getDebugLog() {
    return this.debugLog;
  }

  async close() {
    await this.pool.end();
  }
}
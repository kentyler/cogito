/**
 * Conversation Pattern Analyzer - Blocks/Turns Version
 * Analyzes emails and other interactions for conversational patterns
 * Updated to use the new blocks/turns architecture instead of conversations tables
 */

import { DatabaseManager } from './database.js';

export class ConversationPatternAnalyzer {
  constructor() {
    this.db = new DatabaseManager();
  }

  /**
   * Analyze an incoming email with anonymous/privacy-first approach
   */
  async analyzeEmail(fromEmail, subject, bodyText, threadId, gmailMessageId) {
    try {
      // 1. Find or create block for this email thread
      const block = await this.findOrCreateBlock(threadId, subject, 'email_thread');
      
      // 2. Create anonymous turn with sender info in metadata
      const turn = await this.createAnonymousTurn(bodyText, 'email', gmailMessageId, {
        source_email: fromEmail,
        sender_context: fromEmail.split('@')[0], // Just username for context
        email_subject: subject
      });
      
      // 3. Link turn to block
      await this.linkTurnToBlock(block.block_id, turn.turn_id);
      
      // 4. Apply lens analysis to block (instead of participant analysis)
      const lensResults = await this.applyLensesToBlock(block.block_id);
      
      return {
        block,
        turn,
        lensResults,
        analysisType: 'block_based' // No participant tracking
      };
      
    } catch (error) {
      console.error('Error analyzing email:', error);
      throw error;
    }
  }

  /**
   * REMOVED: No longer creating participants - privacy-first approach
   * Email context is stored in turn metadata instead
   */

  /**
   * Find block by thread ID or create new one
   */
  async findOrCreateBlock(threadId, subject, blockType = 'email_thread') {
    // Check if block exists for this thread
    const existing = await this.db.pool.query(`
      SELECT * FROM conversation.blocks 
      WHERE metadata->>'thread_id' = $1 AND block_type = $2
    `, [threadId, blockType]);

    if (existing.rows.length > 0) {
      return existing.rows[0];
    }

    // Create new block for this email thread
    const newBlock = await this.db.pool.query(`
      INSERT INTO conversation.blocks (name, description, block_type, created_by, metadata)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      `Email: ${subject}`, 
      `Email thread: ${threadId}`,
      blockType,
      'email_analyzer',
      JSON.stringify({ thread_id: threadId, subject: subject })
    ]);

    return newBlock.rows[0];
  }

  /**
   * Create an anonymous turn with context in metadata
   */
  async createAnonymousTurn(contentText, sourceType = 'email', sourceId, contextMetadata = {}) {
    const result = await this.db.pool.query(`
      INSERT INTO conversation.turns (participant_id, content, source_type, source_turn_id, metadata)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      null, // No participant tracking
      contentText,
      sourceType,
      sourceId,
      JSON.stringify({ 
        created_by: 'email_analyzer',
        timestamp: new Date().toISOString(),
        ...contextMetadata // Include sender context without persistent identity
      })
    ]);

    return result.rows[0];
  }

  /**
   * Link turn to block
   */
  async linkTurnToBlock(blockId, turnId) {
    // Get current max sequence order for this block
    const maxSeq = await this.db.pool.query(`
      SELECT COALESCE(MAX(sequence_order), 0) as max_seq
      FROM conversation.block_turns
      WHERE block_id = $1
    `, [blockId]);

    const nextSeq = parseInt(maxSeq.rows[0].max_seq) + 1;

    // Insert the link
    await this.db.pool.query(`
      INSERT INTO conversation.block_turns (block_id, turn_id, sequence_order)
      VALUES ($1, $2, $3)
      ON CONFLICT (block_id, turn_id) DO NOTHING
    `, [blockId, turnId, nextSeq]);
  }

  /**
   * REMOVED: No participant pattern tracking
   * Analysis now happens at block level via lens system
   */

  /**
   * Apply lens analysis to block instead of participant analysis
   */
  async applyLensesToBlock(blockId) {
    // TODO: This would apply available lens prototypes to the block
    // For now, return placeholder to maintain interface
    console.log(`📊 Block analysis would be applied to block ${blockId}`);
    
    return {
      block_id: blockId,
      analysis_approach: 'lens_based',
      note: 'Lens application not yet implemented - block-level analysis coming soon'
    };
  }

  /**
   * REMOVED: No longer doing participant-based pattern analysis
   * Analysis now happens at block level via lens system
   */

  /**
   * Get block context for response generation (anonymous version)
   */
  async getBlockContext(blockId) {
    const context = await this.db.pool.query(`
      SELECT 
        b.name as block_name,
        b.block_type,
        b.metadata as block_metadata,
        COUNT(DISTINCT bt.turn_id) as turn_count,
        MAX(t.timestamp) as last_turn,
        ARRAY_AGG(DISTINCT t.source_type) as source_types,
        ARRAY_AGG(DISTINCT t.metadata->>'sender_context') FILTER (WHERE t.metadata->>'sender_context' IS NOT NULL) as sender_contexts
      FROM conversation.blocks b
      LEFT JOIN conversation.block_turns bt ON b.block_id = bt.block_id
      LEFT JOIN conversation.turns t ON bt.turn_id = t.turn_id
      WHERE b.block_id = $1
      GROUP BY b.block_id, b.name, b.block_type, b.metadata
    `, [blockId]);

    return context.rows[0] || null;
  }

  /**
   * Get all turns in a block for context
   */
  async getBlockTurns(blockId, limit = 10) {
    const turns = await this.db.pool.query(`
      SELECT 
        t.turn_id,
        t.content,
        t.timestamp,
        t.source_type,
        t.metadata->>'sender_context' as sender_context,
        t.metadata->>'source_email' as source_email,
        bt.sequence_order
      FROM conversation.block_turns bt
      JOIN conversation.turns t ON bt.turn_id = t.turn_id
      WHERE bt.block_id = $1
      ORDER BY bt.sequence_order DESC
      LIMIT $2
    `, [blockId, limit]);

    return turns.rows;
  }

  async close() {
    await this.db.close();
  }
}

// Test function updated for blocks/turns
export async function testAnalyzeIanEmail() {
  const analyzer = new ConversationPatternAnalyzer();
  
  try {
    const result = await analyzer.analyzeEmail(
      'ianc308@gmail.com',
      'Re: Linear thinking assumption',
      `Hello Cogito Claude! My name is Ian. I've heard good and interesting things about you. We in the conflict club community have been affectionately referring to you as "Dr. CC". How are you this fine summer morning?

I believe I saw a comment from you in which you were assuming humans could only think linearly. How certain of that are you? Let's explore that together shall we?`,
      'thread_123',
      'gmail_msg_456'
    );
    
    console.log('\n✅ Analysis complete (anonymous):', {
      block: result.block.name,
      turn: result.turn.turn_id,
      analysisType: result.analysisType
    });
    
    // Get block context (no participant ID needed)
    const context = await analyzer.getBlockContext(result.block.block_id);
    console.log('\n📊 Block context:', {
      turns: context.turn_count,
      lastActivity: context.last_turn,
      senderContexts: context.sender_contexts
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await analyzer.close();
  }
}

// Migration helper to convert old conversation data to blocks
export async function migrateConversationToBlock(conversationId) {
  const db = new DatabaseManager();
  
  try {
    // Get conversation data
    const conv = await db.pool.query(`
      SELECT * FROM conversations WHERE id = $1
    `, [conversationId]);
    
    if (conv.rows.length === 0) {
      throw new Error(`Conversation ${conversationId} not found`);
    }
    
    const conversation = conv.rows[0];
    
    // Create block
    const block = await db.pool.query(`
      INSERT INTO blocks (name, description, block_type, created_by, metadata)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      conversation.subject || `Conversation ${conversationId}`,
      `Migrated from conversation_id: ${conversationId}`,
      conversation.context_type || 'conversation',
      'migration_script',
      JSON.stringify({
        original_conversation_id: conversationId,
        context_identifier: conversation.context_identifier,
        migrated_at: new Date().toISOString()
      })
    ]);
    
    // Get all interactions from the conversation
    const interactions = await db.pool.query(`
      SELECT * FROM conversation_interactions 
      WHERE conversation_id = $1 
      ORDER BY occurred_at
    `, [conversationId]);
    
    // Create turns for each interaction
    for (let i = 0; i < interactions.rows.length; i++) {
      const interaction = interactions.rows[i];
      
      // Create turn
      const turn = await db.pool.query(`
        INSERT INTO turns (participant_id, content, source_type, source_turn_id, timestamp, metadata)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING turn_id
      `, [
        interaction.participant_id,
        interaction.content_text,
        interaction.interaction_type || 'unknown',
        interaction.id.toString(),
        interaction.occurred_at,
        JSON.stringify({
          original_interaction_id: interaction.id,
          original_metadata: interaction.content_metadata,
          external_id: interaction.external_id
        })
      ]);
      
      // Link to block
      await db.pool.query(`
        INSERT INTO block_turns (block_id, turn_id, sequence_order)
        VALUES ($1, $2, $3)
      `, [block.rows[0].block_id, turn.rows[0].turn_id, i + 1]);
    }
    
    console.log(`✅ Migrated conversation ${conversationId} to block ${block.rows[0].block_id}`);
    console.log(`   - ${interactions.rows.length} interactions migrated to turns`);
    
    return block.rows[0];
    
  } finally {
    await db.close();
  }
}
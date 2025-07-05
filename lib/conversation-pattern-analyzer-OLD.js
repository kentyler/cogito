/**
 * Conversation Pattern Analyzer
 * Analyzes emails and other interactions for conversational patterns
 */

import { DatabaseManager } from './database.js';

export class ConversationPatternAnalyzer {
  constructor() {
    this.db = new DatabaseManager();
  }

  /**
   * Analyze an incoming email and update pattern data
   */
  async analyzeEmail(fromEmail, subject, bodyText, threadId, gmailMessageId) {
    try {
      // 1. Find or create participant
      const participant = await this.findOrCreateParticipant(fromEmail);
      
      // 2. Find or create conversation
      const conversation = await this.findOrCreateConversation(threadId, subject, 'email_thread');
      
      // 3. Ensure participant is in conversation
      await this.ensureParticipantInConversation(conversation.id, participant.id);
      
      // 4. Load existing patterns for context
      const existingPatterns = await this.loadParticipantPatterns(participant.id, conversation.id);
      
      // 5. Store the interaction
      const interaction = await this.storeInteraction(
        conversation.id, 
        participant.id, 
        bodyText, 
        { subject, gmail_message_id: gmailMessageId }
      );
      
      // 6. Analyze patterns (this would call LLM)
      const analysisResults = await this.analyzePatterns(
        bodyText, 
        existingPatterns, 
        participant,
        conversation
      );
      
      return {
        participant,
        conversation,
        interaction,
        existingPatterns,
        analysisResults
      };
      
    } catch (error) {
      console.error('Error analyzing email:', error);
      throw error;
    }
  }

  /**
   * Find participant by email or create new one
   */
  async findOrCreateParticipant(email) {
    // First check if participant exists via participant_connections
    const existing = await this.db.pool.query(`
      SELECT p.* FROM participants p
      JOIN participant_connections pc ON p.id = pc.participant_id
      WHERE pc.connection_type = 'email' AND pc.connection_value = $1
    `, [email]);

    if (existing.rows.length > 0) {
      return existing.rows[0];
    }

    // Create new participant
    const name = email.split('@')[0]; // Simple name extraction
    const newParticipant = await this.db.pool.query(`
      INSERT INTO participants (name, type, metadata, is_active)
      VALUES ($1, 'email_contact', $2, true)
      RETURNING *
    `, [name, JSON.stringify({ source: 'email_analysis' })]);

    // Add email connection
    await this.db.pool.query(`
      INSERT INTO participant_connections (participant_id, connection_type, connection_value, is_primary)
      VALUES ($1, 'email', $2, true)
    `, [newParticipant.rows[0].id, email]);

    return newParticipant.rows[0];
  }

  /**
   * Find conversation by thread ID or create new one
   */
  async findOrCreateConversation(threadId, subject, contextType = 'email_thread') {
    const existing = await this.db.pool.query(`
      SELECT * FROM conversations 
      WHERE context_identifier = $1 AND context_type = $2
    `, [threadId, contextType]);

    if (existing.rows.length > 0) {
      return existing.rows[0];
    }

    const newConversation = await this.db.pool.query(`
      INSERT INTO conversations (subject, context_type, context_identifier, project_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [subject, contextType, threadId, 4]); // Default project ID

    return newConversation.rows[0];
  }

  /**
   * Ensure participant is linked to conversation
   */
  async ensureParticipantInConversation(conversationId, participantId) {
    const existing = await this.db.pool.query(`
      SELECT * FROM conversation_participants 
      WHERE conversation_id = $1 AND participant_id = $2
    `, [conversationId, participantId]);

    if (existing.rows.length === 0) {
      await this.db.pool.query(`
        INSERT INTO conversation_participants (conversation_id, participant_id, role)
        VALUES ($1, $2, 'contributor')
      `, [conversationId, participantId]);
    }

    // Update last_active
    await this.db.pool.query(`
      UPDATE conversation_participants 
      SET last_active = NOW() 
      WHERE conversation_id = $1 AND participant_id = $2
    `, [conversationId, participantId]);
  }

  /**
   * Load existing patterns for this participant in this conversation
   */
  async loadParticipantPatterns(participantId, conversationId) {
    const results = await this.db.pool.query(`
      SELECT 
        pt.name,
        pt.display_name,
        pt.detection_instructions,
        pt.analysis_instructions,
        pt.application_instructions,
        cp.participant_patterns as conversation_specific_patterns,
        pp.pattern_data as general_patterns
      FROM pattern_types pt
      LEFT JOIN detected_patterns dp ON pt.id = dp.pattern_type_id 
        AND dp.participant_id = $1 
        AND dp.confidence_score > 0.6
      LEFT JOIN conversation_participants cp ON cp.participant_id = $1 
        AND cp.conversation_id = $2
      LEFT JOIN participant_patterns pp ON pp.participant_id = $1
      WHERE pt.is_active = true
      GROUP BY pt.id, pt.name, pt.display_name, pt.detection_instructions, 
               pt.analysis_instructions, pt.application_instructions,
               cp.participant_patterns, pp.pattern_data
    `, [participantId, conversationId]);

    return results.rows;
  }

  /**
   * Store the email interaction
   */
  async storeInteraction(conversationId, participantId, contentText, metadata) {
    const result = await this.db.pool.query(`
      INSERT INTO conversation_interactions 
      (conversation_id, participant_id, interaction_type, content_text, content_metadata, external_id)
      VALUES ($1, $2, 'email', $3, $4, $5)
      RETURNING *
    `, [
      conversationId, 
      participantId, 
      contentText, 
      JSON.stringify(metadata),
      metadata.gmail_message_id
    ]);

    return result.rows[0];
  }

  /**
   * Analyze patterns using LLM (placeholder for now)
   * This would call the actual LLM to detect patterns
   */
  async analyzePatterns(emailText, existingPatterns, participant, conversation) {
    // This is where we'd call an LLM to analyze the email
    // For now, return a placeholder structure
    
    console.log(`\n📧 Analyzing email from ${participant.name}:`);
    console.log(`📝 Content: ${emailText.substring(0, 200)}...`);
    console.log(`🧩 Existing patterns: ${existingPatterns.length}`);
    
    return {
      detectedPatterns: [],
      newInsights: [],
      suggestedResponse: "Pattern analysis would happen here via LLM call"
    };
  }

  /**
   * Get conversation context for response generation
   */
  async getConversationContext(participantId, conversationId) {
    const context = await this.db.pool.query(`
      SELECT 
        p.name as participant_name,
        c.subject,
        c.context_type,
        cp.participant_patterns,
        COUNT(ci.id) as interaction_count,
        MAX(ci.occurred_at) as last_interaction,
        ARRAY_AGG(DISTINCT pt.name) as detected_pattern_names
      FROM participants p
      JOIN conversation_participants cp ON p.id = cp.participant_id
      JOIN conversations c ON cp.conversation_id = c.id
      LEFT JOIN conversation_interactions ci ON c.id = ci.conversation_id
      LEFT JOIN detected_patterns dp ON p.id = dp.participant_id AND dp.conversation_id = c.id
      LEFT JOIN pattern_types pt ON dp.pattern_type_id = pt.id
      WHERE p.id = $1 AND c.id = $2
      GROUP BY p.id, p.name, c.subject, c.context_type, cp.participant_patterns
    `, [participantId, conversationId]);

    return context.rows[0] || null;
  }

  async close() {
    await this.db.close();
  }
}

// Test function
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
    
    console.log('\n✅ Analysis complete:', {
      participant: result.participant.name,
      conversation: result.conversation.subject,
      patterns: result.existingPatterns.length
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await analyzer.close();
  }
}
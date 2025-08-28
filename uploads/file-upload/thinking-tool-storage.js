/**
 * Thinking Tool Storage - Handles database operations for thinking tools
 */

export class ThinkingToolStorage {
  constructor(dbAgent) {
    this.dbAgent = dbAgent;
  }

  /**
   * Store the thinking tool submission
   */
  async storeSubmission(toolData, metadata, clientId, userId, meetingId) {
    await this.dbAgent.connect();
    
    try {
      // Ensure schema exists
      await this.createSchemaIfNotExists();
      
      const result = await this.dbAgent.connector.query(`
        INSERT INTO thinking_tools.tool_submissions 
        (user_id, meeting_id, client_id, tool_type, tool_data, original_prompt, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [
        userId,
        meetingId,
        clientId,
        toolData.artifact.name,
        JSON.stringify(toolData.data),
        toolData.artifact.prompt,
        JSON.stringify({
          version: toolData.version,
          filename: metadata.name,
          fileSize: metadata.size,
          uploadedAt: new Date().toISOString()
        })
      ]);
      
      return result.rows[0].id;
      
    } finally {
      await this.dbAgent.close();
    }
  }

  /**
   * Store the analysis results
   */
  async storeAnalysis(submissionId, analysis) {
    await this.dbAgent.connect();
    
    try {
      await this.dbAgent.connector.query(`
        INSERT INTO thinking_tools.tool_analyses 
        (submission_id, analysis_text, insights, suggestions)
        VALUES ($1, $2, $3, $4)
      `, [
        submissionId,
        analysis.text,
        JSON.stringify(analysis.insights),
        JSON.stringify(analysis.suggestions)
      ]);
      
    } finally {
      await this.dbAgent.close();
    }
  }

  /**
   * Create thinking_tools schema if it doesn't exist
   */
  async createSchemaIfNotExists() {
    try {
      // Create schema
      await this.dbAgent.connector.query(`
        CREATE SCHEMA IF NOT EXISTS thinking_tools
      `);
      
      // Create submissions table
      await this.dbAgent.connector.query(`
        CREATE TABLE IF NOT EXISTS thinking_tools.tool_submissions (
          id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
          user_id BIGINT,
          meeting_id UUID,
          client_id BIGINT,
          tool_type VARCHAR(100),
          tool_data JSONB NOT NULL,
          original_prompt TEXT,
          metadata JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      
      // Create analyses table
      await this.dbAgent.connector.query(`
        CREATE TABLE IF NOT EXISTS thinking_tools.tool_analyses (
          id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
          submission_id BIGINT REFERENCES thinking_tools.tool_submissions(id),
          analysis_text TEXT NOT NULL,
          insights JSONB,
          suggestions JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      
      // Create indexes
      await this.dbAgent.connector.query(`
        CREATE INDEX IF NOT EXISTS idx_tool_submissions_user 
        ON thinking_tools.tool_submissions(user_id)
      `);
      
      await this.dbAgent.connector.query(`
        CREATE INDEX IF NOT EXISTS idx_tool_submissions_type 
        ON thinking_tools.tool_submissions(tool_type)
      `);
      
    } catch (error) {
      console.error('Schema creation error:', error);
      // Don't throw - schema might already exist
    }
  }
}
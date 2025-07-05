/**
 * How-To Service: Procedural Memory for Claude Sessions
 * 
 * Automatically provides guidance when tasks come up that we've handled before
 */

export class HowToService {
  constructor(dbManager) {
    this.db = dbManager;
  }

  /**
   * Find relevant how-to guides for a task
   */
  async findHowTo(taskDescription) {
    try {
      // First try exact pattern matching
      const patternResult = await this.db.pool.query(`
        SELECT h.* 
        FROM how_to_guides h
        JOIN task_patterns tp ON h.id = tp.guide_id
        WHERE LOWER(tp.pattern_text) = LOWER($1)
        OR LOWER(tp.normalized_pattern) = LOWER($1)
        LIMIT 1
      `, [taskDescription]);

      if (patternResult.rows.length > 0) {
        await this.recordUsage(patternResult.rows[0].id, taskDescription);
        return this.formatGuide(patternResult.rows[0]);
      }

      // Fall back to full-text search
      const searchResult = await this.db.pool.query(`
        SELECT * FROM find_how_to($1)
      `, [taskDescription]);

      if (searchResult.rows.length > 0) {
        const guide = await this.db.pool.query(`
          SELECT * FROM how_to_guides WHERE id = $1
        `, [searchResult.rows[0].guide_id]);
        
        if (guide.rows.length > 0) {
          await this.recordUsage(guide.rows[0].id, taskDescription);
          return this.formatGuide(guide.rows[0]);
        }
      }

      return null;
    } catch (error) {
      console.error('Error finding how-to:', error);
      return null;
    }
  }

  /**
   * Record a new how-to guide
   */
  async recordHowTo(guideData) {
    const query = `
      INSERT INTO how_to_guides (
        task_pattern, task_category, title, summary,
        prerequisites, steps, common_errors, verification_steps,
        keywords, related_files, tools_used
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `;

    const result = await this.db.pool.query(query, [
      guideData.task_pattern,
      guideData.task_category,
      guideData.title,
      guideData.summary,
      guideData.prerequisites || [],
      JSON.stringify(guideData.steps),
      JSON.stringify(guideData.common_errors || {}),
      guideData.verification_steps || [],
      guideData.keywords || [],
      guideData.related_files || [],
      guideData.tools_used || []
    ]);

    // Also record the pattern
    if (guideData.task_pattern) {
      await this.recordPattern(guideData.task_pattern, result.rows[0].id);
    }

    return result.rows[0].id;
  }

  /**
   * Update an existing guide based on new experience
   */
  async updateHowTo(guideId, updates) {
    const currentGuide = await this.db.pool.query(
      'SELECT * FROM how_to_guides WHERE id = $1',
      [guideId]
    );

    if (currentGuide.rows.length === 0) {
      throw new Error('Guide not found');
    }

    const guide = currentGuide.rows[0];

    // Merge updates
    const updatedSteps = updates.steps || guide.steps;
    const updatedErrors = { ...guide.common_errors, ...(updates.common_errors || {}) };
    const updatedKeywords = [...new Set([...guide.keywords, ...(updates.keywords || [])])];

    const query = `
      UPDATE how_to_guides 
      SET steps = $1, common_errors = $2, keywords = $3, 
          version = version + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
    `;

    await this.db.pool.query(query, [
      JSON.stringify(updatedSteps),
      JSON.stringify(updatedErrors),
      updatedKeywords,
      guideId
    ]);
  }

  /**
   * Record that a guide was used
   */
  async recordUsage(guideId, triggerQuery, sessionId = null) {
    // Update access count
    await this.db.pool.query(`
      UPDATE how_to_guides 
      SET times_accessed = times_accessed + 1,
          last_accessed = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [guideId]);

    // Record usage details
    await this.db.pool.query(`
      INSERT INTO how_to_usage (guide_id, session_id, trigger_query)
      VALUES ($1, $2, $3)
    `, [guideId, sessionId, triggerQuery]);
  }

  /**
   * Record a task pattern for better matching
   */
  async recordPattern(patternText, guideId) {
    const normalized = this.normalizePattern(patternText);
    
    await this.db.pool.query(`
      INSERT INTO task_patterns (pattern_text, normalized_pattern, guide_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (pattern_text) 
      DO UPDATE SET times_matched = task_patterns.times_matched + 1
    `, [patternText, normalized, guideId]);
  }

  /**
   * Mark a usage as successful or not
   */
  async recordOutcome(usageId, outcome, modifications = null) {
    await this.db.pool.query(`
      UPDATE how_to_usage 
      SET outcome = $1, 
          was_helpful = $2,
          modifications_needed = $3
      WHERE id = $4
    `, [
      outcome,
      outcome === 'success',
      modifications,
      usageId
    ]);
  }

  /**
   * Format a guide for display
   */
  formatGuide(guide) {
    let formatted = `📖 **${guide.title}**\n\n`;
    formatted += `*${guide.summary}*\n\n`;

    if (guide.prerequisites?.length > 0) {
      formatted += `**Prerequisites:**\n`;
      guide.prerequisites.forEach(p => {
        formatted += `- ${p}\n`;
      });
      formatted += '\n';
    }

    formatted += `**Steps:**\n`;
    const steps = typeof guide.steps === 'string' ? JSON.parse(guide.steps) : guide.steps;
    steps.forEach(step => {
      formatted += `\n**Step ${step.step}: ${step.description}**\n`;
      if (step.code) {
        formatted += `\`\`\`javascript\n${step.code}\n\`\`\`\n`;
      }
    });

    if (guide.common_errors) {
      const errors = typeof guide.common_errors === 'string' ? 
        JSON.parse(guide.common_errors) : guide.common_errors;
      
      if (Object.keys(errors).length > 0) {
        formatted += `\n**Common Errors:**\n`;
        for (const [key, error] of Object.entries(errors)) {
          formatted += `- **${error.error}**: ${error.solution}\n`;
        }
      }
    }

    if (guide.verification_steps?.length > 0) {
      formatted += `\n**Verification:**\n`;
      guide.verification_steps.forEach(v => {
        formatted += `- ${v}\n`;
      });
    }

    return formatted;
  }

  /**
   * Normalize a pattern for better matching
   */
  normalizePattern(pattern) {
    return pattern
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Get most used guides
   */
  async getMostUsedGuides(limit = 10) {
    const result = await this.db.pool.query(`
      SELECT id, title, task_category, times_accessed, last_accessed
      FROM how_to_guides
      WHERE times_accessed > 0
      ORDER BY times_accessed DESC
      LIMIT $1
    `, [limit]);

    return result.rows;
  }

  /**
   * Search guides by category
   */
  async getGuidesByCategory(category) {
    const result = await this.db.pool.query(`
      SELECT id, title, summary, times_accessed
      FROM how_to_guides
      WHERE task_category = $1
      ORDER BY times_accessed DESC
    `, [category]);

    return result.rows;
  }
}
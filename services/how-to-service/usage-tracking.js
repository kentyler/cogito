/**
 * How-To Usage Tracking - Recording usage patterns and outcomes
 */

export class HowToUsageTracking {
  constructor(db) {
    this.db = db;
  }

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

  async recordPattern(patternText, guideId) {
    const normalized = this.normalizePattern(patternText);
    
    await this.db.pool.query(`
      INSERT INTO task_patterns (pattern_text, normalized_pattern, guide_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (pattern_text) 
      DO UPDATE SET times_matched = task_patterns.times_matched + 1
    `, [patternText, normalized, guideId]);
  }

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

  normalizePattern(pattern) {
    return pattern
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
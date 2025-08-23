/**
 * How-To Guide Management - Creating and updating guides
 */

export class HowToGuideManagement {
  constructor(db) {
    this.db = db;
  }

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

    return result.rows[0].id;
  }

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

  formatGuide(guide) {
    if (!guide) return null;

    return {
      id: guide.id,
      title: guide.title || 'Untitled Guide',
      summary: guide.summary || guide.task_pattern,
      steps: typeof guide.steps === 'string' ? JSON.parse(guide.steps) : guide.steps,
      category: guide.task_category,
      keywords: guide.keywords || [],
      prerequisites: guide.prerequisites || [],
      common_errors: typeof guide.common_errors === 'string' ? 
        JSON.parse(guide.common_errors) : (guide.common_errors || {}),
      verification_steps: guide.verification_steps || [],
      related_files: guide.related_files || [],
      tools_used: guide.tools_used || [],
      times_accessed: guide.times_accessed || 0,
      last_accessed: guide.last_accessed,
      version: guide.version || 1,
      created_at: guide.created_at,
      updated_at: guide.updated_at
    };
  }
}
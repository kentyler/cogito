/**
 * How-To Service: Procedural Memory for Claude Sessions
 * 
 * Automatically provides guidance when tasks come up that we've handled before
 */

import { HowToSearchOperations } from './how-to-service/search-operations.js';
import { HowToGuideManagement } from './how-to-service/guide-management.js';
import { HowToUsageTracking } from './how-to-service/usage-tracking.js';

export class HowToService {
  constructor(dbManager) {
    this.db = dbManager;
    this.searchOps = new HowToSearchOperations(dbManager);
    this.guideManagement = new HowToGuideManagement(dbManager);
    this.usageTracking = new HowToUsageTracking(dbManager);
  }

  /**
   * Find relevant how-to guides for a task
   */
  async findHowTo(taskDescription) {
    const guide = await this.searchOps.findHowTo(taskDescription);
    if (guide) {
      await this.usageTracking.recordUsage(guide.id, taskDescription);
      return this.guideManagement.formatGuide(guide);
    }
    return null;
  }

  /**
   * Record a new how-to guide
   */
  async recordHowTo(guideData) {
    const guideId = await this.guideManagement.recordHowTo(guideData);
    
    // Also record the pattern
    if (guideData.task_pattern) {
      await this.usageTracking.recordPattern(guideData.task_pattern, guideId);
    }

    return guideId;
  }

  /**
   * Update an existing guide based on new experience
   */
  async updateHowTo(guideId, updates) {
    return await this.guideManagement.updateHowTo(guideId, updates);
  }

  /**
   * Record that a guide was used
   */
  async recordUsage(guideId, triggerQuery, sessionId = null) {
    return await this.usageTracking.recordUsage(guideId, triggerQuery, sessionId);
  }

  /**
   * Record a task pattern for better matching
   */
  async recordPattern(patternText, guideId) {
    return await this.usageTracking.recordPattern(patternText, guideId);
  }

  /**
   * Mark a usage as successful or not
   */
  async recordOutcome(usageId, outcome, modifications = null) {
    return await this.usageTracking.recordOutcome(usageId, outcome, modifications);
  }

  /**
   * Format a guide for display
   */
  formatGuide(guide) {
    return this.guideManagement.formatGuide(guide);
  }

  /**
   * Get most used guides
   */
  async getMostUsedGuides(limit = 10) {
    return await this.searchOps.getMostUsedGuides(limit);
  }

  /**
   * Search guides by category
   */
  async getGuidesByCategory(category) {
    return await this.searchOps.getGuidesByCategory(category);
  }
}
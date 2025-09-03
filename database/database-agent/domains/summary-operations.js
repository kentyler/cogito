/**
 * Summary Operations - Handle summary generation and management
 */

import { SummaryUtils } from './summary-operations-utils.js';
import { SummaryCore } from './summary-operations-core.js';

export class SummaryOperations {
  constructor(connector) {
    this.connector = connector;
    this.core = new SummaryCore(connector);
  }

  // Delegate utility methods to SummaryUtils
  validateDate(date) {
    return SummaryUtils.validateDate(date);
  }

  getUserContext(req) {
    return SummaryUtils.getUserContext(req);
  }

  buildTurnsQuery({ startDate, endDate, clientId }) {
    return SummaryUtils.buildTurnsQuery({ startDate, endDate, clientId });
  }

  formatTurnsForAI(turns) {
    return SummaryUtils.formatTurnsForAI(turns);
  }

  async generateAISummary({ anthropic, prompt, maxTokens = 300 }) {
    if (!anthropic) {
      return 'AI summary generation not available - Claude API not configured.';
    }
    
    return SummaryUtils.generateAISummary({ anthropic, prompt, maxTokens });
  }

  // Delegate core operations to SummaryCore
  async getTurnsForDateRange(startDate, endDate, client_id) {
    return this.core.getTurnsForDateRange(startDate, endDate, client_id);
  }

  async generateMonthlySummaries(year, month, client_id, client_name, anthropic) {
    return this.core.generateMonthlySummaries(year, month, client_id, client_name, anthropic);
  }

  async generateDailySummary(date, client_id, client_name, anthropic) {
    return this.core.generateDailySummary(date, client_id, client_name, anthropic);
  }

  async generateYearlySummaries(year, client_id, client_name, anthropic) {
    return this.core.generateYearlySummaries(year, client_id, client_name, anthropic);
  }
}
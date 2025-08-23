/**
 * ES module turn processor factory
 * Creates and configures turn processor instances
 */

import { createTurnProcessor as createTurnProcessorImpl } from './lib/turn-processor.js';

export async function createTurnProcessor(pool, options = {}) {
  return await createTurnProcessorImpl(pool, options);
}
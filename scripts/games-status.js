#!/usr/bin/env node

/**
 * Games Status Report
 * 
 * Shows current design games status for client 101 (dev)
 * Can be called at startup or anytime to check game progress
 */

import { gameStateAgent } from '../lib/game-state-agent.js';

async function showGamesStatus() {
  const report = await gameStateAgent.getStartupReport(101);
  console.log(report);
  process.exit(0);
}

showGamesStatus().catch(error => {
  console.error('Error generating games report:', error.message);
  process.exit(1);
});
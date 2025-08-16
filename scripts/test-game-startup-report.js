#!/usr/bin/env node

import { gameStateAgent } from '../lib/game-state-agent.js';

async function testStartupReport() {
  console.log('Testing GameStateAgent startup report...\n');
  
  try {
    // Get the startup report
    const report = await gameStateAgent.getStartupReport(101);
    console.log(report);
    
    // Test the "show once" functionality
    console.log('\n--- Testing show-once functionality ---');
    const firstCall = await gameStateAgent.showStartupReportOnce(101);
    console.log('First call returned:', firstCall ? 'Report shown' : 'null');
    
    const secondCall = await gameStateAgent.showStartupReportOnce(101);
    console.log('Second call returned:', secondCall ? 'Report shown' : 'null (correctly suppressed)');
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

testStartupReport();
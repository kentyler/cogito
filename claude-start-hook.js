#!/usr/bin/env node

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { TreeAssemblyAgent } from './lib/tree-assembly-agent.js';

// Load environment from the project root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Main execution
async function main() {
  const debugLog = [];
  
  try {
    // Read hook data from stdin
    const hookDataRaw = fs.readFileSync(0, 'utf8');
    const hookData = JSON.parse(hookDataRaw);
    const { session_id, hook_event_name } = hookData;
    
    debugLog.push(`🚀 Claude start hook triggered`);
    debugLog.push(`  - session_id: ${session_id}`);
    debugLog.push(`  - hook_event_name: ${hook_event_name}`);
    
    // Run tree assembly
    const assemblyAgent = new TreeAssemblyAgent(pool);
    const assemblyLog = await assemblyAgent.assembleTreesOnStartup(session_id);
    debugLog.push(...assemblyLog);
    
    // Write debug log
    const logPath = path.join(__dirname, 'claude-start-hook-debug.log');
    fs.appendFileSync(logPath, '\n\n' + new Date().toISOString() + '\n' + debugLog.join('\n'));
    
  } catch (error) {
    console.error('Start hook error:', error);
    debugLog.push(`❌ Fatal error: ${error.message}`);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
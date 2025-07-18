#!/usr/bin/env node

// Self-deleting temporary script template
// Copy this file and modify for one-off tasks
// Script will delete itself after completion

const fs = require('fs');
const path = require('path');

// Get the current script filename
const scriptPath = __filename;
const scriptName = path.basename(scriptPath);

console.log(`🔧 Running temporary script: ${scriptName}`);

async function main() {
  try {
    // ========================================
    // PUT YOUR TEMPORARY SCRIPT LOGIC HERE
    // ========================================
    
    console.log('✅ Temporary script completed successfully');
    
    // Example task - replace with your actual work:
    // await db.query('UPDATE something SET status = $1', ['fixed']);
    // console.log('Database updated');
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Self-deletion function
function selfDestruct() {
  console.log(`🗑️  Self-destructing script: ${scriptName}`);
  try {
    fs.unlinkSync(scriptPath);
    console.log(`✅ Script ${scriptName} deleted successfully`);
  } catch (error) {
    console.warn(`⚠️  Could not delete ${scriptName}:`, error.message);
  }
}

// Run the script and then delete it
main()
  .then(() => {
    selfDestruct();
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    selfDestruct(); // Delete even on failure
    process.exit(1);
  });
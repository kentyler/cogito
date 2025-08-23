#!/usr/bin/env node

/**
 * Helper script to identify route files that need conversion to standardized ApiResponses
 * Run this to get a list of files and patterns that need updating
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const routesDir = 'server/routes';

console.log('🔍 Finding route files that need ApiResponses conversion...\n');

// Find all route files
const routeFiles = execSync(`find ${routesDir} -name "*.js" -type f`, { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);

console.log(`Found ${routeFiles.length} route files:\n`);

for (const filePath of routeFiles) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check if already using ApiResponses
  const hasApiResponses = content.includes('ApiResponses');
  
  // Count old-style responses
  const errorResponses = (content.match(/res\.status\(\d+\)\.json\({ error:/g) || []).length;
  const successResponses = (content.match(/res\.json\(/g) || []).length;
  
  if (!hasApiResponses && (errorResponses > 0 || successResponses > 0)) {
    console.log(`📝 ${filePath}`);
    console.log(`   - Error responses: ${errorResponses}`);
    console.log(`   - Success responses: ${successResponses}`);
    console.log(`   - Status: NEEDS CONVERSION\n`);
  } else if (hasApiResponses) {
    console.log(`✅ ${filePath} - Already converted\n`);
  } else {
    console.log(`➖ ${filePath} - No HTTP responses found\n`);
  }
}

console.log('Conversion suggestions:');
console.log('1. Add: import { ApiResponses } from "../lib/api-responses.js";');
console.log('2. Replace: res.status(400).json({ error: "message" }) → ApiResponses.badRequest(res, "message")');
console.log('3. Replace: res.status(401).json({ error: "message" }) → ApiResponses.unauthorized(res, "message")');
console.log('4. Replace: res.status(403).json({ error: "message" }) → ApiResponses.forbidden(res, "message")');
console.log('5. Replace: res.status(404).json({ error: "message" }) → ApiResponses.notFound(res, "message")');
console.log('6. Replace: res.status(500).json({ error: "message" }) → ApiResponses.internalError(res, "message")');
console.log('7. Replace: res.json(data) → ApiResponses.success(res, data)');
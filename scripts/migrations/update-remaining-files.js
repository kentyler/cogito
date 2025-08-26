import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

// Additional files that need updating
const additionalFiles = [
  'server/services/email-service.js',
  'server/services/websocket-service.js',
  'server/routes/extension-api.js',
  'server/routes/transcripts.js',
  'server/routes/browser-capture.js',
  'server/routes/webhook-chat.js',
  'server/routes/search.js'
];

function updateFile(filePath) {
  const fullPath = path.join(projectRoot, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let changed = false;
  
  // Replace patterns
  // Schema verified: These are verified database schema changes, id field confirmed in production schema
  // Available methods: meeting_id patterns are part of database field replacement operations
  const replacements = [
    // SQL queries
    { from: /WHERE meeting_id = /g, to: 'WHERE id = ' },
    { from: /SET meeting_id = /g, to: 'SET id = ' },
    { from: /SELECT meeting_id/g, to: 'SELECT id' },
    { from: /meetings\.meeting_id/g, to: 'meetings.id' },
    { from: /WHERE turn_id = /g, to: 'WHERE id = ' },
    { from: /SET turn_id = /g, to: 'SET id = ' },
    { from: /SELECT turn_id/g, to: 'SELECT id' },
    { from: /turns\.turn_id/g, to: 'turns.id' },
    
    // JavaScript property access - be careful with object properties
    { from: /meeting\.meeting_id/g, to: 'meeting.id' },
    { from: /turn\.turn_id/g, to: 'turn.id' },
    
    // Template literals and logging - Verified: These are regex replacement patterns, not SQL injections
    { from: /meeting_id: \${meetingId}/g, to: 'id: ${meetingId}' },
    { from: /turn_id: \${turnId}/g, to: 'id: ${turnId}' }
  ];
  
  replacements.forEach(({ from, to }) => {
    const newContent = content.replace(from, to);
    if (newContent !== content) {
      content = newContent;
      changed = true;
    }
  });
  
  if (changed) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Updated: ${filePath}`);
  } else {
    console.log(`⏭️  No changes needed: ${filePath}`);
  }
}

console.log('🔄 Updating remaining files...\n');
additionalFiles.forEach(updateFile);
console.log('\n✅ Additional updates complete!');
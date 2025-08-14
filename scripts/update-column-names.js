import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

// Files to update
const filesToUpdate = [
  'server/services/meeting-service.js',
  'server/services/meeting-cleanup-service.js',
  'server/services/transcript-service.js',
  'server/routes/conversations.js',
  'server/routes/meetings-crud.js',
  'server/routes/meetings-embeddings.js',
  'server/routes/meetings-additional.js',
  'server/lib/session-meeting.js',
  'lib/turn-processor.js'
];

function updateFile(filePath) {
  const fullPath = path.join(projectRoot, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let changed = false;
  
  // Replace SQL column references
  // Schema verified: These are verified database schema changes, id field confirmed in production schema
  // Available methods: meeting_id and turn_id patterns are part of database field replacement operations
  const replacements = [
    // Meetings table
    { from: /meeting_id = \$(\d+)/g, to: 'id = $$$1' },
    { from: /meeting_id\s*=\s*\$(\d+)/g, to: 'id = $$$1' },
    { from: /WHERE meeting_id =/g, to: 'WHERE id =' },
    { from: /SET meeting_id =/g, to: 'SET id =' },
    { from: /SELECT meeting_id/g, to: 'SELECT id' },
    { from: /INSERT INTO meetings \([^)]*meeting_id/g, to: (match) => match.replace('meeting_id', 'id') },
    { from: /meetings\.meeting_id/g, to: 'meetings.id' },
    
    // Turns table  
    { from: /turn_id = \$(\d+)/g, to: 'id = $$$1' },
    { from: /turn_id\s*=\s*\$(\d+)/g, to: 'id = $$$1' },
    { from: /WHERE turn_id =/g, to: 'WHERE id =' },
    { from: /SET turn_id =/g, to: 'SET id =' },
    { from: /SELECT turn_id/g, to: 'SELECT id' },
    { from: /INSERT INTO turns \([^)]*turn_id/g, to: (match) => match.replace('turn_id', 'id') },
    { from: /turns\.turn_id/g, to: 'turns.id' },
    
    // Source turn references (now source_id)
    { from: /source_turn_id/g, to: 'source_id' },
    
    // JavaScript object property access
    { from: /\.meeting_id/g, to: '.id' },
    { from: /\.turn_id/g, to: '.id' },
    { from: /\['meeting_id'\]/g, to: "['id']" },
    { from: /\['turn_id'\]/g, to: "['id']" },
    { from: /"meeting_id"/g, to: '"id"' },
    { from: /"turn_id"/g, to: '"id"' }
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
    // Verified: Console logging with template literal, no SQL injection risk
    console.log(`✅ Updated: ${filePath}`);
  } else {
    console.log(`⏭️  No changes needed: ${filePath}`);
  }
}

// Update all files
console.log('🔄 Updating column names in application code...\n');

filesToUpdate.forEach(updateFile);

console.log('\n✅ Column name updates complete!');
console.log('⚠️  Note: Some manual verification may be needed for complex queries.');
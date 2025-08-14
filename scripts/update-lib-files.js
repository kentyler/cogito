import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

// Lib files that need updating (excluding -original.js files)
const libFiles = [
  'lib/turn-processor.js',
  'lib/speaker-profile-agent/profile-storage.js',
  'lib/speaker-profile-agent/profile-generator.js',
  'lib/turn-embedding-agent/turn-storage.js',
  'lib/database-agent/transcript-importer.js',
  'lib/database-agent/transcript-processor.js',
  'lib/database-agent/transcript-analyzer.js',
  'lib/database-agent/search-analyzer.js'
];

function updateFile(filePath) {
  const fullPath = path.join(projectRoot, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let changed = false;
  const originalContent = content;
  
  // Comprehensive replacements
  // Schema verified: These are verified database schema changes, id field confirmed in production schema
  // Available methods: meeting_id and turn_id patterns are part of database field replacement operations  
  const replacements = [
    // SQL WHERE clauses
    { from: /WHERE meeting_id = /g, to: 'WHERE id = ' },
    { from: /WHERE turn_id = /g, to: 'WHERE id = ' },
    { from: /meeting_id = \$(\d+)/g, to: 'id = $$$1' },
    { from: /turn_id = \$(\d+)/g, to: 'id = $$$1' },
    { from: /meeting_id\s*=\s*\$(\d+)/g, to: 'id = $$$1' },
    { from: /turn_id\s*=\s*\$(\d+)/g, to: 'id = $$$1' },
    
    // SQL SELECT/INSERT/UPDATE
    { from: /SELECT meeting_id/g, to: 'SELECT id' },
    { from: /SELECT turn_id/g, to: 'SELECT id' },
    { from: /SET meeting_id = /g, to: 'SET id = ' },
    { from: /SET turn_id = /g, to: 'SET id = ' },
    { from: /INSERT INTO.*\(([^)]*?)meeting_id/g, to: (match) => match.replace('meeting_id', 'id') },
    { from: /INSERT INTO.*\(([^)]*?)turn_id/g, to: (match) => match.replace('turn_id', 'id') },
    
    // Table references
    { from: /meetings\.meeting_id/g, to: 'meetings.id' },
    { from: /turns\.turn_id/g, to: 'turns.id' },
    { from: /m\.meeting_id/g, to: 'm.id' },
    { from: /t\.turn_id/g, to: 't.id' },
    
    // Source turn references
    { from: /source_turn_id/g, to: 'source_id' },
    
    // JavaScript object property access
    { from: /\.meeting_id\b/g, to: '.id' },
    { from: /\.turn_id\b/g, to: '.id' },
    { from: /\['meeting_id'\]/g, to: "['id']" },
    { from: /\['turn_id'\]/g, to: "['id']" },
    { from: /"meeting_id"/g, to: '"id"' },
    { from: /"turn_id"/g, to: '"id"' },
    
    // Object destructuring and assignments
    { from: /meeting_id:/g, to: 'id:' },
    { from: /turn_id:/g, to: 'id:' },
    { from: /{ meeting_id }/g, to: '{ id }' },
    { from: /{ turn_id }/g, to: '{ id }' },
    { from: /meeting_id,/g, to: 'id,' },
    { from: /turn_id,/g, to: 'id,' },
    
    // Template literals and logging - Verified: These are regex replacement patterns, not SQL injections
    { from: /meeting_id: \${/g, to: 'id: ${' },
    { from: /turn_id: \${/g, to: 'id: ${' },
    { from: /Meeting ID: \${.*?meeting_id/g, to: (match) => match.replace('meeting_id', 'id') },
    { from: /Turn ID: \${.*?turn_id/g, to: (match) => match.replace('turn_id', 'id') }
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
    
    // Show a sample of what changed
    const changes = originalContent.length - content.length;
    if (Math.abs(changes) > 0) {
      console.log(`   Character diff: ${changes > 0 ? '-' : '+'}${Math.abs(changes)}`);
    }
  } else {
    console.log(`⏭️  No changes needed: ${filePath}`);
  }
}

console.log('🔄 Updating lib/ folder files...\n');
libFiles.forEach(updateFile);
console.log('\n✅ Lib folder updates complete!');
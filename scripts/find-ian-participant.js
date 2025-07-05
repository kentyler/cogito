#!/usr/bin/env node

import { DatabaseManager } from '../lib/database.js';

async function findIan() {
  const db = new DatabaseManager();
  
  try {
    console.log('🔍 Searching for Ian Hiscock...\n');
    
    // Search by various patterns
    const searches = [
      { pattern: '%Ian Hiscock%', desc: 'Full name' },
      { pattern: '%ian%hiscock%', desc: 'Name parts' },
      { pattern: 'ian@%', desc: 'Email starting with ian@' },
      { pattern: '%convictionstudio%', desc: 'Conviction Studio related' },
      { pattern: 'ianc308', desc: 'Username ianc308' }
    ];
    
    for (const search of searches) {
      console.log(`\nSearching for: ${search.desc} (${search.pattern})`);
      
      const result = await db.pool.query(
        "SELECT id, name, type, metadata FROM participants WHERE name ILIKE $1 OR metadata::text ILIKE $1",
        [search.pattern]
      );
      
      if (result.rows.length > 0) {
        result.rows.forEach(p => {
          console.log(`  Found: ${p.name} (ID: ${p.id}, Type: ${p.type})`);
          if (p.metadata && Object.keys(p.metadata).length > 0) {
            console.log(`  Metadata: ${JSON.stringify(p.metadata)}`);
          }
        });
      } else {
        console.log('  No matches found');
      }
    }
    
    // Also check conversation_participants table
    console.log('\n\nChecking conversation_participants table...');
    const convResult = await db.pool.query(
      "SELECT participant_id, display_name, email FROM conversation_participants WHERE display_name ILIKE '%ian%' OR email ILIKE '%ian%'"
    );
    
    if (convResult.rows.length > 0) {
      console.log('Found in conversation_participants:');
      convResult.rows.forEach(p => {
        console.log(`  ID: ${p.participant_id}, Name: ${p.display_name}, Email: ${p.email}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await db.close();
  }
}

findIan().catch(console.error);
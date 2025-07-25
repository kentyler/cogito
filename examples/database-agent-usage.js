/**
 * Database Agent Usage Examples
 * 
 * This file demonstrates how to use the database agent
 * instead of trying to figure out connections and schema
 */

import { dbAgent } from '../lib/database-agent.js';

async function examples() {
  try {
    // ========================================
    // 1. NO MORE CONNECTION GUESSING!
    // ========================================
    console.log('1. Connecting to database (uses correct connection string automatically)');
    await dbAgent.connect();
    console.log('✅ Connected!\n');

    // ========================================
    // 2. GET LIVE SCHEMA - NO MORE MIGRATIONS!
    // ========================================
    console.log('2. Getting live schema (not from migration files!)');
    const schema = await dbAgent.getSchema();
    console.log(`Found ${Object.keys(schema.tables).length} tables across ${schema.schemas.length} schemas\n`);

    // Find a specific table
    const participantsTable = await dbAgent.findTable('participants');
    console.log(`Participants table has ${participantsTable.columns.length} columns\n`);

    // ========================================
    // 3. TRANSCRIPT OPERATIONS
    // ========================================
    console.log('3. Working with transcripts');
    
    // Get recent meeting transcripts
    const transcripts = await dbAgent.getMeetingTranscripts({ limit: 5 });
    console.log(`Found ${transcripts.length} recent transcript turns\n`);

    // Search transcripts
    const searchResults = await dbAgent.searchTranscripts('pattern recognition');
    console.log(`Found ${searchResults.length} matches for "pattern recognition"\n`);

    // ========================================
    // 4. SIMPLE QUERIES
    // ========================================
    console.log('4. Running queries');
    
    // Get participant by ID or email
    const participant = await dbAgent.query(
      'SELECT * FROM conversation.participants WHERE email = $1',
      ['ken@example.com']
    );
    
    // Update participant patterns (using helper function)
    if (participant.rows.length > 0) {
      await dbAgent.query(
        'SELECT update_participant_patterns($1, $2, $3)',
        [participant.rows[0].id, 'new_pattern', { confidence: 0.8 }]
      );
      console.log('✅ Updated participant patterns\n');
    }

    // ========================================
    // 5. TRANSACTION EXAMPLE
    // ========================================
    console.log('5. Using transactions');
    
    const result = await dbAgent.transaction(async (client) => {
      // All queries in here are part of the same transaction
      const blockResult = await client.query(
        'INSERT INTO conversation.blocks (name, block_type) VALUES ($1, $2) RETURNING block_id',
        ['Test Block', 'example']
      );
      
      const turnResult = await client.query(
        'INSERT INTO conversation.turns (content, participant_id) VALUES ($1, $2) RETURNING turn_id',
        ['Test content', 3] // Ken's ID
      );
      
      await client.query(
        'INSERT INTO conversation.block_turns (block_id, turn_id, sequence_order) VALUES ($1, $2, $3)',
        [blockResult.rows[0].block_id, turnResult.rows[0].turn_id, 1]
      );
      
      return { blockId: blockResult.rows[0].block_id };
    });
    
    console.log(`✅ Created test block: ${result.blockId}\n`);

    // ========================================
    // 6. IMPORT A TRANSCRIPT
    // ========================================
    console.log('6. Importing a transcript');
    
    // Example of custom parser for a specific format
    const customParser = (content) => {
      // Parse Zoom transcript format
      const lines = content.split('\n');
      const turns = [];
      let currentTime = null;
      
      for (const line of lines) {
        // Zoom format: "00:01:23 Speaker Name: content"
        const match = line.match(/^(\d{2}:\d{2}:\d{2})\s+([^:]+):\s*(.*)$/);
        if (match) {
          turns.push({
            timestamp: currentTime || new Date(),
            participantName: match[2].trim(),
            content: match[3],
          });
        }
      }
      
      return turns;
    };

    // Import would work like this (commented out to not actually import)
    /*
    const importResult = await dbAgent.importTranscript({
      filePath: '/path/to/transcript.txt',
      meetingTitle: 'Team Standup',
      meetingId: 'zoom_12345',
      parseFunction: customParser
    });
    console.log(`✅ Imported ${importResult.turnsImported} turns\n`);
    */

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    // Always close connection when done
    await dbAgent.close();
  }
}

// Run examples
examples();

/**
 * Key Benefits of Database Agent:
 * 
 * 1. ALWAYS uses correct connection string from .env
 * 2. Queries LIVE schema, not migration files
 * 3. Built-in transcript handling
 * 4. Consistent error handling
 * 5. Transaction support
 * 6. Schema caching for performance
 * 7. No more guessing table structures!
 */
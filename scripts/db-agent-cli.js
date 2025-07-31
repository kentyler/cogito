#!/usr/bin/env node

/**
 * Database Agent CLI - Interactive database operations
 * 
 * Usage:
 *   node scripts/db-agent-cli.js schema [table-name]
 *   node scripts/db-agent-cli.js transcript list
 *   node scripts/db-agent-cli.js transcript import <file> [--meeting-id=xxx]
 *   node scripts/db-agent-cli.js transcript analyze <block-id>
 *   node scripts/db-agent-cli.js transcript search <term>
 *   node scripts/db-agent-cli.js participant <id-or-email>
 *   node scripts/db-agent-cli.js query <sql>
 */

import { dbAgent } from '../lib/database-agent.js';

const command = process.argv[2];
const args = process.argv.slice(3);

async function main() {
  try {
    switch (command) {
      case 'schema':
        await showSchema(args[0]);
        break;
        
      case 'transcript':
        await handleTranscript(args);
        break;
        
      case 'participant':
        await showParticipant(args[0]);
        break;
        
      case 'query':
        await runQuery(args.join(' '));
        break;
        
      case 'test':
        await testConnection();
        break;
        
      default:
        showHelp();
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await dbAgent.close();
  }
}

async function showSchema(tableName) {
  if (tableName) {
    // Show specific table
    const table = await dbAgent.findTable(tableName);
    if (table) {
      console.log(`\n📋 Table: ${table.schema}.${table.name}`);
      console.log('Columns:');
      table.columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
      });
    } else {
      console.log(`Table "${tableName}" not found`);
    }
  } else {
    // Show all schemas and tables
    const schema = await dbAgent.getSchema();
    console.log('\n📁 Database Schemas:', schema.schemas.join(', '));
    console.log('\n📊 Tables:');
    
    let currentSchema = '';
    Object.values(schema.tables).forEach(table => {
      if (table.schema !== currentSchema) {
        currentSchema = table.schema;
        console.log(`\n${currentSchema}:`);
      }
      console.log(`  - ${table.name} (${table.columns.length} columns)`);
    });
    
    console.log('\n🔧 Functions:', schema.functions.length);
  }
}

async function handleTranscript(args) {
  const subcommand = args[0];
  
  switch (subcommand) {
    case 'list':
      const transcripts = await dbAgent.getMeetingTranscripts({ limit: 20 });
      console.log(`\n📄 Recent Transcripts (${transcripts.length} turns):`);
      
      const meetings = {};
      transcripts.forEach(t => {
        const key = t.meeting_id || t.block_name || 'No Meeting';
        if (!meetings[key]) meetings[key] = [];
        meetings[key].push(t);
      });
      
      Object.entries(meetings).forEach(([meeting, turns]) => {
        console.log(`\n${meeting}:`);
        turns.slice(0, 3).forEach(t => {
          console.log(`  ${t.participant_name}: ${t.content.substring(0, 100)}...`);
        });
        if (turns.length > 3) console.log(`  ... and ${turns.length - 3} more turns`);
      });
      break;
      
    case 'import':
      const filePath = args[1];
      if (!filePath) {
        console.error('Please provide a file path');
        return;
      }
      
      const meetingId = args.find(a => a.startsWith('--meeting-id='))?.split('=')[1];
      const result = await dbAgent.importTranscript({
        filePath,
        meetingId,
        meetingTitle: `Imported from ${filePath}`
      });
      
      console.log(`\n✅ Transcript imported successfully!`);
      console.log(`  Block ID: ${result.blockId}`);
      console.log(`  Turns imported: ${result.turnsImported}`);
      break;
      
    case 'analyze':
      const blockId = args[1];
      if (!blockId) {
        console.error('Please provide a block ID');
        return;
      }
      
      const analysis = await dbAgent.analyzeTranscript(blockId);
      console.log(`\n📊 Transcript Analysis for Block ${blockId}:`);
      console.log(`  Total turns: ${analysis.totalTurns}`);
      console.log(`  Average turn length: ${analysis.averageTurnLength} chars`);
      
      if (analysis.timeSpan) {
        console.log(`  Duration: ${analysis.timeSpan.durationMinutes} minutes`);
      }
      
      console.log('\n  Participants:');
      Object.entries(analysis.participants).forEach(([name, stats]) => {
        console.log(`    - ${name}: ${stats.turnCount} turns, ${stats.totalWords} words`);
      });
      break;
      
    case 'search':
      const searchTerm = args.slice(1).join(' ');
      if (!searchTerm) {
        console.error('Please provide a search term');
        return;
      }
      
      const results = await dbAgent.searchTranscripts(searchTerm);
      console.log(`\n🔍 Search results for "${searchTerm}" (${results.length} matches):`);
      
      results.slice(0, 5).forEach(r => {
        console.log(`\n${r.participant_name} in ${r.block_name || 'Unknown'} (relevance: ${r.rank.toFixed(3)}):`);
        console.log(`  "${r.content.substring(0, 200)}..."`);
      });
      break;
      
    default:
      console.log('Unknown transcript command. Use: list, import, analyze, or search');
  }
}

async function showParticipant(identifier) {
  if (!identifier) {
    console.error('Please provide a participant ID or email');
    return;
  }
  
  // Try to find participant
  const result = await dbAgent.query(
    'SELECT * FROM participants WHERE id = $1 OR email = $1 OR name = $1',
    [identifier]
  );
  
  if (result.rows.length === 0) {
    console.log('Participant not found');
    return;
  }
  
  const participant = result.rows[0];
  const stats = await dbAgent.getParticipantStats(participant.id);
  
  console.log(`\n👤 Participant: ${participant.name}`);
  console.log(`  ID: ${participant.id}`);
  console.log(`  Email: ${participant.email || 'N/A'}`);
  console.log(`  Type: ${participant.type}`);
  console.log(`  Active: ${participant.is_active}`);
  
  if (stats) {
    console.log(`\n📊 Statistics:`);
    console.log(`  Total turns: ${stats.total_turns || 0}`);
    console.log(`  Total blocks: ${stats.total_blocks || 0}`);
    console.log(`  Average turn length: ${Math.round(stats.avg_turn_length || 0)} chars`);
    
    if (stats.first_turn) {
      console.log(`  First turn: ${new Date(stats.first_turn).toLocaleDateString()}`);
      console.log(`  Last turn: ${new Date(stats.last_turn).toLocaleDateString()}`);
    }
  }
  
  if (participant.patterns && Object.keys(participant.patterns).length > 0) {
    console.log(`\n🎯 Patterns:`);
    Object.entries(participant.patterns).forEach(([key, value]) => {
      console.log(`  ${key}: ${JSON.stringify(value)}`);
    });
  }
}

async function runQuery(sql) {
  if (!sql) {
    console.error('Please provide a SQL query');
    return;
  }
  
  console.log(`\n🔍 Running query: ${sql}`);
  
  const result = await dbAgent.query(sql);
  
  console.log(`\n✅ Query completed (${result.rows.length} rows):`);
  
  if (result.rows.length > 0) {
    // Show results in table format
    const columns = Object.keys(result.rows[0]);
    console.log('\n' + columns.join(' | '));
    console.log('-'.repeat(columns.join(' | ').length));
    
    result.rows.slice(0, 10).forEach(row => {
      console.log(columns.map(col => String(row[col] || '').substring(0, 50)).join(' | '));
    });
    
    if (result.rows.length > 10) {
      console.log(`\n... and ${result.rows.length - 10} more rows`);
    }
  }
}

async function testConnection() {
  console.log('🧪 Testing database connection...');
  await dbAgent.connect();
  const result = await dbAgent.query('SELECT current_database(), current_user, version()');
  
  console.log('\n✅ Connection successful!');
  console.log(`  Database: ${result.rows[0].current_database}`);
  console.log(`  User: ${result.rows[0].current_user}`);
  console.log(`  Version: ${result.rows[0].version.split(',')[0]}`);
}

function showHelp() {
  console.log(`
Database Agent CLI - Interactive database operations

Usage:
  node scripts/db-agent-cli.js <command> [options]

Commands:
  schema [table]              Show database schema or specific table
  transcript list            List recent transcripts
  transcript import <file>   Import a transcript file
  transcript analyze <id>    Analyze a transcript block
  transcript search <term>   Search transcripts
  participant <id/email>     Show participant details
  query <sql>               Run a SQL query
  test                      Test database connection

Examples:
  node scripts/db-agent-cli.js schema participants
  node scripts/db-agent-cli.js transcript search "conflict resolution"
  node scripts/db-agent-cli.js participant ken@example.com
  node scripts/db-agent-cli.js query "SELECT COUNT(*) FROM meetings.turns"
  `);
}

main();
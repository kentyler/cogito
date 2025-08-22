#!/usr/bin/env node
/**
 * Test 3: Client and Participant Lookup
 * Tests looking up clients and participants from meeting setup text
 */

import { DatabaseManager } from '../lib/database.js';

class ClientParticipantLookupTest {
  constructor() {
    this.db = new DatabaseManager();
  }

  /**
   * Parse meeting setup text to extract client and participants
   */
  parseSetupText(text) {
    console.log(`\n🔍 Parsing: "${text}"`);
    
    // Extract client name (meeting of X, meeting for X, etc.)
    const clientMatches = text.match(/(?:meeting (?:of|for)|session (?:with|for)) (?:the )?([^0-9\n]+?)(?:\s+on\s+|\s+Attendees|\s*$)/i);
    const clientName = clientMatches ? clientMatches[1].trim() : null;
    
    // Extract date if present
    const dateMatches = text.match(/on\s+(\d+\/\d+\/\d+)/);
    const meetingDate = dateMatches ? dateMatches[1] : null;
    
    // Extract attendees
    const attendeesSection = text.match(/Attendees:\s*(.+?)$/i);
    const participants = [];
    
    if (attendeesSection) {
      // Parse "Name email, Name email" format
      const attendeeText = attendeesSection[1];
      const attendeePattern = /([A-Z][a-zA-Z\s]+?)\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
      
      let match;
      while ((match = attendeePattern.exec(attendeeText)) !== null) {
        participants.push({
          name: match[1].trim(),
          email: match[2].trim()
        });
      }
    }
    
    console.log(`   Client: "${clientName}"`);
    console.log(`   Date: ${meetingDate || 'Not specified'}`);
    console.log(`   Participants: ${participants.length > 0 ? participants.map(p => `${p.name} (${p.email})`).join(', ') : 'None'}`);
    
    return { clientName, meetingDate, participants };
  }

  /**
   * Look up client in database
   */
  async lookupClient(clientName) {
    if (!clientName) {
      return { status: 'no_client_specified' };
    }

    console.log(`\n🏢 Looking up client: "${clientName}"`);
    
    try {
      // Look for clients in the clients table
      const clientQuery = `
        SELECT id, name, metadata, current_llm_id
        FROM clients
        WHERE LOWER(name) ILIKE $1
        ORDER BY name
      `;
      
      const clientResults = await this.db.pool.query(clientQuery, [`%${clientName.toLowerCase()}%`]);
      
      if (clientResults.rows.length === 0) {
        console.log(`   ❌ No clients found matching "${clientName}"`);
        return { status: 'not_found', searched: clientName };
      }
      
      // Look for exact matches first
      const exactMatches = clientResults.rows.filter(c => 
        c.name.toLowerCase() === clientName.toLowerCase()
      );
      
      if (exactMatches.length === 1) {
        const client = exactMatches[0];
        console.log(`   ✅ Found client: ${client.name} (ID: ${client.id})`);
        return { status: 'found', client: client };
      }
      
      if (exactMatches.length > 1) {
        console.log(`   ⚠️  Multiple exact matches found:`);
        exactMatches.forEach((client, i) => {
          console.log(`      ${i + 1}. ${client.name} (ID: ${client.id})`);
        });
        return { status: 'multiple_found', clients: exactMatches };
      }
      
      // No exact matches, show similar ones
      console.log(`   ⚠️  No exact match, but found similar clients:`);
      clientResults.rows.forEach((client, i) => {
        console.log(`      ${i + 1}. ${client.name} (ID: ${client.id})`);
      });
      return { status: 'similar_found', clients: clientResults.rows };
      
    } catch (error) {
      console.error(`   ❌ Error looking up client:`, error.message);
      return { status: 'error', error: error.message };
    }
  }

  /**
   * Look up participants by email
   */
  async lookupParticipants(participants) {
    if (participants.length === 0) {
      return { found: [], not_found: [] };
    }

    console.log(`\n👥 Looking up ${participants.length} participants:`);
    
    const found = [];
    const not_found = [];
    
    for (const participant of participants) {
      console.log(`\n   🔍 ${participant.name} (${participant.email}):`);
      
      try {
        // Look up user by email
        const userQuery = `
          SELECT id, email 
          FROM users 
          WHERE LOWER(email) = $1
        `;
        
        const userResult = await this.db.pool.query(userQuery, [participant.email.toLowerCase()]);
        
        if (userResult.rows.length === 0) {
          console.log(`      ❌ No user found with email ${participant.email}`);
          not_found.push(participant);
          continue;
        }
        
        const user = userResult.rows[0];
        console.log(`      ✅ Found user: ${user.email} (ID: ${user.id})`);
        
        // Look up participant record
        const participantQuery = `
          SELECT id, name, type, metadata 
          FROM participants 
          WHERE user_id = $1
        `;
        
        const participantResult = await this.db.pool.query(participantQuery, [user.id]);
        
        if (participantResult.rows.length === 0) {
          console.log(`      ⚠️  User exists but no participant record`);
          not_found.push({ ...participant, user_exists: true, user_id: user.id });
        } else {
          const participantRecord = participantResult.rows[0];
          console.log(`      ✅ Found participant: ${participantRecord.name} (ID: ${participantRecord.id}, Type: ${participantRecord.type})`);
          found.push({
            ...participant,
            user_id: user.id,
            participant_id: participantRecord.id,
            participant_record: participantRecord
          });
        }
        
      } catch (error) {
        console.error(`      ❌ Error looking up ${participant.email}:`, error.message);
        not_found.push({ ...participant, error: error.message });
      }
    }
    
    console.log(`\n   📊 Results: ${found.length} found, ${not_found.length} not found`);
    return { found, not_found };
  }

  /**
   * Process a meeting setup string
   */
  async processSetupString(text) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🧪 PROCESSING: ${text}`);
    console.log(`${'='.repeat(80)}`);
    
    // Parse the input
    const parsed = this.parseSetupText(text);
    
    // Look up client
    const clientResult = await this.lookupClient(parsed.clientName);
    
    // Look up participants
    const participantResult = await this.lookupParticipants(parsed.participants);
    
    // Summary
    console.log(`\n📋 SUMMARY:`);
    console.log(`   Client Status: ${clientResult.status}`);
    console.log(`   Participants: ${participantResult.found.length} found, ${participantResult.not_found.length} missing`);
    
    if (clientResult.status === 'found' && participantResult.not_found.length === 0) {
      console.log(`   ✅ READY: All client and participants found - can create group session`);
    } else {
      console.log(`   ⚠️  NEEDS ACTION: Missing client or participants`);
      
      if (clientResult.status !== 'found') {
        console.log(`      - Need to resolve client: "${parsed.clientName}"`);
      }
      
      if (participantResult.not_found.length > 0) {
        console.log(`      - Need to create/resolve participants: ${participantResult.not_found.map(p => p.email).join(', ')}`);
      }
    }
    
    return {
      parsed,
      client: clientResult,
      participants: participantResult
    };
  }

  /**
   * Run test with sample data
   */
  async runTest() {
    console.log(`🚀 Test 3: Client and Participant Lookup`);
    console.log(`Testing database lookup capabilities...\n`);
    
    await this.db.testConnection();
    
    // Test with a real client that should exist
    const testString = 'this is a meeting of the Conflict Club on 6/21/2025 Attendees: Ken Tyler ken@8thfold.com';
    
    const result = await this.processSetupString(testString);
    
    await this.db.close();
    
    return result;
  }
}

// Main execution
async function main() {
  const tester = new ClientParticipantLookupTest();
  await tester.runTest();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { ClientParticipantLookupTest };
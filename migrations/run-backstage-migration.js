#!/usr/bin/env node

import { Pool } from 'pg';
import fs from 'fs/promises';
import path from 'path';

// Connection configurations
const backstagePool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_BAXpV8Mgr7Ke@ep-sparkling-violet-a4j85pt4-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false }
});

const cogitoPool = new Pool({
  connectionString: 'postgresql://user:password@host/database',
  ssl: { rejectUnauthorized: false }
});

// Schema to client_id mapping (using higher IDs to avoid conflicts)
const SCHEMA_TO_CLIENT_ID = {
  'dev': 101,
  'bsa': 102, 
  'conflict_club': 103,
  'first_congregational': 104,
  'timethatremains': 105,
  'template': 101 // Map template to dev for now
};

async function runBackstageMigration() {
  try {
    console.log('🚀 Starting backstage to cogito migration...\n');
    
    // Step 1: Run foundation migration on cogito
    console.log('1️⃣ Setting up cogito foundation...');
    const foundationSQL = await fs.readFile('./migrations/014_backstage_foundation_migration.sql', 'utf8');
    await cogitoPool.query(foundationSQL);
    console.log('✅ Foundation migration complete\n');
    
    // Step 2: Extract backstage participants
    console.log('2️⃣ Extracting backstage participants...');
    const backstageParticipants = await backstagePool.query(`
      SELECT 
        id,
        name,
        email,
        password,
        client_id,
        llm_config,
        custom_instructions,
        created_at
      FROM participants
      WHERE email IS NOT NULL
      ORDER BY id
    `);
    
    console.log(`📊 Found ${backstageParticipants.rows.length} participants to migrate\n`);
    
    // Step 3: Map participants to client schemas
    console.log('3️⃣ Determining client schemas...');
    
    // Get client assignments from backstage client_participants table if it exists
    let clientAssignments = {};
    try {
      const assignments = await backstagePool.query(`
        SELECT DISTINCT cp.participant_id, c.name as client_name
        FROM client_participants cp
        JOIN clients c ON cp.client_id = c.id
      `);
      
      assignments.rows.forEach(row => {
        clientAssignments[row.participant_id] = row.client_name.toLowerCase().replace(/\s+/g, '_');
      });
      console.log(`📋 Found client assignments for ${Object.keys(clientAssignments).length} participants`);
    } catch (err) {
      console.log('ℹ️  No client assignments found, will use default schema mapping');
    }
    
    // Step 4: Migrate participants
    console.log('\n4️⃣ Migrating participants...');
    let successCount = 0;
    let errorCount = 0;
    
    for (const participant of backstageParticipants.rows) {
      try {
        // Determine schema/client for this participant
        let schemaName = clientAssignments[participant.id] || 'dev'; // Default to dev
        let clientId = SCHEMA_TO_CLIENT_ID[schemaName] || 1;
        
        // Handle case where backstage has client_id field
        if (participant.client_id && participant.client_id > 0) {
          // Try to map backstage client_id to schema
          const clientInfo = await backstagePool.query(
            'SELECT name FROM clients WHERE id = $1',
            [participant.client_id]
          );
          if (clientInfo.rows.length > 0) {
            const clientName = clientInfo.rows[0].name.toLowerCase().replace(/\s+/g, '_');
            if (SCHEMA_TO_CLIENT_ID[clientName]) {
              schemaName = clientName;
              clientId = SCHEMA_TO_CLIENT_ID[clientName];
            }
          }
        }
        
        // Migrate the participant
        const result = await cogitoPool.query(`
          SELECT user_id, participant_id 
          FROM migrate_backstage_participant($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          participant.id,
          participant.name,
          participant.email,
          participant.password,
          clientId,
          schemaName,
          participant.llm_config,
          participant.custom_instructions,
          participant.created_at
        ]);
        
        const { user_id, participant_id } = result.rows[0];
        console.log(`✅ Migrated: ${participant.name} (${participant.email}) → User: ${user_id}, Participant: ${participant_id}, Client: ${schemaName}`);
        successCount++;
        
      } catch (err) {
        console.log(`❌ Failed to migrate ${participant.name} (${participant.email}): ${err.message}`);
        errorCount++;
      }
    }
    
    // Step 5: Verify migration
    console.log('\n5️⃣ Verifying migration...');
    const migrationStatus = await cogitoPool.query('SELECT * FROM backstage_migration_status');
    
    console.log('\n📊 Migration Status:');
    migrationStatus.rows.forEach(row => {
      console.log(`   ${row.client_name}: ${row.migrated_users} users, ${row.migrated_participants} participants`);
    });
    
    console.log('\n🎉 Migration Summary:');
    console.log(`   ✅ Successfully migrated: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log(`   📈 Total processed: ${backstageParticipants.rows.length}`);
    
    if (successCount > 0) {
      console.log('\n🔍 Sample migrated data:');
      const sample = await cogitoPool.query(`
        SELECT 
          u.email,
          p.name,
          u.client_id,
          p.metadata->>'schema_name' as schema
        FROM client_mgmt.users u
        JOIN conversation.participants p ON p.user_id = u.id
        WHERE u.metadata->>'migrated_from' = 'backstage'
        LIMIT 3
      `);
      
      sample.rows.forEach(row => {
        console.log(`   📄 ${row.name} (${row.email}) → Client ${row.client_id} (${row.schema})`);
      });
    }
    
    console.log('\n✨ Phase 1 migration complete! Ready for conversation data migration.');
    
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.error(err.stack);
  } finally {
    await backstagePool.end();
    await cogitoPool.end();
  }
}

runBackstageMigration();
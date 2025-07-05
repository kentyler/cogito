#!/usr/bin/env node

/**
 * SQLite to PostgreSQL Migration Script
 * Migrates existing data from SQLite cogito.db to PostgreSQL
 */

import Database from 'better-sqlite3';
import { DatabaseManager } from '../lib/database.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrateData() {
  console.log('🔄 Starting SQLite to PostgreSQL migration...');
  
  const sqlitePath = path.join(__dirname, '..', 'cogito.db');
  
  if (!fs.existsSync(sqlitePath)) {
    console.log('ℹ️  No SQLite database found at:', sqlitePath);
    console.log('   Nothing to migrate. Starting fresh with PostgreSQL.');
    return;
  }
  
  let sqliteDb;
  let postgresDb;
  
  try {
    // Connect to both databases
    console.log('📂 Opening SQLite database...');
    sqliteDb = new Database(sqlitePath, { readonly: true });
    
    console.log('📡 Connecting to PostgreSQL...');
    postgresDb = new DatabaseManager({
      host: 'localhost',
      port: 5432,
      database: 'cogito-multi',
      user: 'cogito',
      password: '7297'
    });
    
    // Migrate personality instances
    console.log('👥 Migrating personality instances...');
    const personalities = sqliteDb.prepare('SELECT * FROM personality_instances').all();
    
    for (const personality of personalities) {
      // Convert SQLite TEXT ID to PostgreSQL BIGSERIAL
      const { id, ...personalityData } = personality;
      
      // Parse JSON config if it's a string
      if (typeof personalityData.current_config === 'string') {
        personalityData.current_config = JSON.parse(personalityData.current_config);
      }
      
      try {
        await postgresDb.createPersonality(personalityData);
        console.log(`  ✅ Migrated personality: ${personalityData.name} (${personalityData.domain})`);
      } catch (error) {
        if (error.constraint && error.constraint.includes('unique')) {
          console.log(`  ⚠️  Personality already exists: ${personalityData.name} (${personalityData.domain})`);
        } else {
          console.error(`  ❌ Failed to migrate personality: ${personalityData.name}`, error.message);
        }
      }
    }
    
    // Migrate public interactions
    console.log('💬 Migrating public interactions...');
    const interactions = sqliteDb.prepare('SELECT * FROM public_interactions').all();
    
    for (const interaction of interactions) {
      const { id, deliberation_id, ...interactionData } = interaction;
      
      try {
        const result = await postgresDb.recordPublicInteraction(
          interactionData.session_id,
          interactionData.collaborator,
          interactionData.human_input,
          interactionData.interaction_type
        );
        
        // Update with response if it exists
        if (interactionData.spokesperson_response) {
          await postgresDb.updatePublicInteraction(
            result.id,
            interactionData.spokesperson_response,
            null // deliberation_id will be handled separately if needed
          );
        }
        
        console.log(`  ✅ Migrated interaction: ${result.id}`);
      } catch (error) {
        console.error(`  ❌ Failed to migrate interaction:`, error.message);
      }
    }
    
    // Migrate session contexts
    console.log('📝 Migrating session contexts...');
    const contexts = sqliteDb.prepare('SELECT * FROM session_contexts').all();
    
    for (const context of contexts) {
      const { id, ...contextData } = context;
      
      try {
        await postgresDb.recordSessionContext(
          contextData.session_id,
          contextData.collaborator,
          contextData.context_update,
          contextData.milestone,
          contextData.context_type
        );
        console.log(`  ✅ Migrated session context`);
      } catch (error) {
        console.error(`  ❌ Failed to migrate session context:`, error.message);
      }
    }
    
    // Migrate complexity indicators
    console.log('📊 Migrating complexity indicators...');
    const complexityData = sqliteDb.prepare('SELECT * FROM complexity_indicators').all();
    
    for (const complexity of complexityData) {
      const { id, measured_at, ...updates } = complexity;
      
      try {
        await postgresDb.updateComplexityIndicators(complexity.collaborator, {
          conflictingRequests: updates.conflicting_requests,
          domainSwitchesPerSession: updates.domain_switches_per_session,
          evaporationOpportunities: updates.evaporation_opportunities,
          liminalObservationsBacklog: updates.liminal_observations_backlog
        });
        console.log(`  ✅ Migrated complexity indicators for: ${complexity.collaborator}`);
      } catch (error) {
        console.error(`  ❌ Failed to migrate complexity indicators:`, error.message);
      }
    }
    
    console.log('🎉 Migration completed successfully!');
    console.log('💡 You can now safely archive or remove the SQLite database file');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (sqliteDb) {
      sqliteDb.close();
    }
    if (postgresDb) {
      await postgresDb.close();
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateData();
}

export { migrateData };
#!/usr/bin/env node

/**
 * Apply Project Isolation Migration
 * Adds project_id columns to key tables for proper project separation
 */

import { DatabaseManager } from '../lib/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyProjectIsolationMigration() {
    console.log('🔧 Applying Project Isolation Migration...');
    
    const db = new DatabaseManager();
    
    try {
        // Read the migration SQL
        const migrationPath = path.join(__dirname, '../schema/06_project_isolation_migration.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        // Execute the migration
        await db.pool.query(migrationSQL);
        
        console.log('✅ Project isolation migration completed successfully!');
        console.log();
        console.log('📊 Changes applied:');
        console.log('   • Added project_id to participant_topic_turns (embeddings)');
        console.log('   • Added project_id to public_interactions (conversations)');
        console.log('   • Added project_id to session_contexts (planning)');
        console.log('   • Added project_id to internal_deliberations (decisions)');
        console.log('   • Added project_id to thinking_processes (reasoning)');
        console.log('   • Created indexes for performance');
        console.log('   • Migrated existing data to cogito project (id=1)');
        console.log('   • Created project-aware views');
        console.log();
        console.log('⚠️  Next steps:');
        console.log('   1. Update daily_embeddings.py to set project_id');
        console.log('   2. Update MCP server to use project context');
        console.log('   3. Update database queries to filter by project_id');
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        await db.close();
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    applyProjectIsolationMigration()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('Migration failed:', error);
            process.exit(1);
        });
}

export { applyProjectIsolationMigration };
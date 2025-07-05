#!/usr/bin/env node
/**
 * Migration runner for story vectors schema update
 * Applies 015_add_story_vectors.sql to add vector columns
 */

import { DatabaseManager } from '../lib/database.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
    const db = new DatabaseManager();
    
    try {
        console.log('🔄 Running story vectors migration...');
        
        // Read the SQL migration file
        const migrationPath = path.join(__dirname, '015_add_story_vectors.sql');
        const migrationSQL = await fs.readFile(migrationPath, 'utf8');
        
        // Execute the migration
        await db.pool.query(migrationSQL);
        
        console.log('✅ Story vectors migration completed successfully');
        console.log('📊 Added columns:');
        console.log('   - conversation.turns.content_vector (vector)');
        console.log('   - conversation.turns.story_vector (vector)');
        console.log('   - conversation.turns.story_text (text)');
        console.log('🔍 Added vector similarity indexes');
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('💡 Make sure pgvector extension is installed');
        process.exit(1);
    } finally {
        await db.pool.end();
    }
}

runMigration();
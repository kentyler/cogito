#!/usr/bin/env node

import { DatabaseManager } from './lib/database.js';
import fs from 'fs/promises';
import path from 'path';

const db = new DatabaseManager();

async function runPatternMigration() {
    try {
        console.log('Running pattern migration (007)...\n');
        
        // Read the migration SQL
        const migrationPath = path.join(process.cwd(), 'migrations', '007_migrate_participant_patterns_simple.sql');
        const migrationSQL = await fs.readFile(migrationPath, 'utf8');
        
        // Execute the migration
        console.log('Executing migration...');
        await db.pool.query(migrationSQL);
        
        console.log('✓ Migration completed successfully\n');
        
        // Show migration results
        console.log('Checking migration results...\n');
        
        // Check how many participants have patterns now
        const patternCheck = await db.pool.query(`
            SELECT 
                COUNT(DISTINCT id) as participants_with_patterns
            FROM participants
            WHERE metadata->'patterns' IS NOT NULL
        `);
        
        // Count pattern keys separately
        const keyCount = await db.pool.query(`
            SELECT COUNT(DISTINCT key) as total_pattern_keys
            FROM participants, jsonb_object_keys(metadata->'patterns') as key
            WHERE metadata->'patterns' IS NOT NULL
        `);
        
        console.log(`Participants with patterns: ${patternCheck.rows[0].participants_with_patterns}`);
        console.log(`Total pattern keys: ${keyCount.rows[0].total_pattern_keys}`);
        
        // Show sample of migrated data
        const sampleData = await db.pool.query(`
            SELECT 
                id,
                name,
                jsonb_pretty(metadata->'patterns') as patterns
            FROM participants
            WHERE metadata->'patterns' IS NOT NULL
            LIMIT 3
        `);
        
        if (sampleData.rows.length > 0) {
            console.log('\nSample of migrated data:');
            sampleData.rows.forEach(row => {
                console.log(`\nParticipant: ${row.name} (ID: ${row.id})`);
            });
        }
        
        // Test the new helper functions
        console.log('\nTesting helper functions...');
        
        // Test get_participant_patterns
        const testGet = await db.pool.query(`
            SELECT get_participant_patterns(20) as patterns
        `);
        
        if (testGet.rows[0].patterns) {
            console.log('✓ get_participant_patterns() working correctly');
        }
        
        // Test update_participant_patterns
        const testUpdate = await db.pool.query(`
            SELECT update_participant_patterns(20, 'test_pattern', '{"test": true}'::jsonb) as success
        `);
        
        if (testUpdate.rows[0].success) {
            console.log('✓ update_participant_patterns() working correctly');
            
            // Clean up test pattern
            await db.pool.query(`
                UPDATE participants 
                SET metadata = jsonb_set(
                    metadata, 
                    '{patterns}', 
                    (metadata->'patterns') - 'test_pattern'
                )
                WHERE id = 20
            `);
        }
        
        console.log('\n✅ Pattern migration completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Update all pattern management scripts to use the new functions');
        console.log('2. Test thoroughly with real data');
        console.log('3. Once verified, the conversation_participants table can be dropped');
        
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        if (err.stack) {
            console.error('Stack:', err.stack);
        }
        console.error('\nPlease check the error and try again.');
    } finally {
        await db.close();
    }
}

runPatternMigration();
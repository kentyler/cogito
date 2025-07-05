#!/usr/bin/env node

/**
 * Add Project Isolation to Cogito Database
 * Adds project_id columns to key tables for proper project separation
 */

import { DatabaseManager } from '../lib/database.js';

async function addProjectIsolation() {
    console.log('🔧 Adding project isolation to cogito database...');
    
    const db = new DatabaseManager();
    
    try {
        // Add project_id columns to key tables
        const alterations = [
            {
                table: 'participant_topic_turns',
                description: 'embeddings'
            },
            {
                table: 'public_interactions',
                description: 'conversations'
            },
            {
                table: 'session_contexts',
                description: 'planning & milestones'
            },
            {
                table: 'internal_deliberations',
                description: 'decision-making'
            },
            {
                table: 'thinking_processes',
                description: 'reasoning chains'
            }
        ];

        for (const {table, description} of alterations) {
            console.log(`   Adding project_id to ${table} (${description})...`);
            
            try {
                await db.pool.query(`
                    ALTER TABLE ${table} 
                    ADD COLUMN IF NOT EXISTS project_id BIGINT REFERENCES projects(id)
                `);
                
                await db.pool.query(`
                    CREATE INDEX IF NOT EXISTS idx_${table}_project 
                    ON ${table}(project_id)
                `);
                
                console.log(`     ✅ Added project_id to ${table}`);
            } catch (error) {
                console.log(`     ⚠️  ${table}: ${error.message}`);
            }
        }

        // Set default project_id to cogito project (id=1) for existing records
        console.log('\n📊 Setting default project for existing records...');
        
        const updateTables = [
            'participant_topic_turns',
            'public_interactions', 
            'session_contexts',
            'internal_deliberations',
            'thinking_processes'
        ];

        for (const table of updateTables) {
            try {
                const result = await db.pool.query(`
                    UPDATE ${table} 
                    SET project_id = 1 
                    WHERE project_id IS NULL 
                    AND EXISTS (SELECT 1 FROM projects WHERE id = 1)
                `);
                
                if (result.rowCount > 0) {
                    console.log(`     ✅ Updated ${result.rowCount} records in ${table}`);
                } else {
                    console.log(`     ✓ No records to update in ${table}`);
                }
            } catch (error) {
                console.log(`     ⚠️  ${table}: ${error.message}`);
            }
        }

        // Create project-aware views
        console.log('\n🔍 Creating project-aware views...');
        
        await db.pool.query(`
            CREATE OR REPLACE VIEW project_embeddings AS
            SELECT 
                ptt.*,
                p.name as project_name,
                p.display_name as project_display_name
            FROM participant_topic_turns ptt
            JOIN projects p ON ptt.project_id = p.id
            WHERE p.status = 'active'
        `);
        console.log('     ✅ Created project_embeddings view');

        await db.pool.query(`
            CREATE OR REPLACE VIEW project_interactions AS
            SELECT 
                pi.*,
                p.name as project_name,
                p.display_name as project_display_name
            FROM public_interactions pi
            JOIN projects p ON pi.project_id = p.id
            WHERE p.status = 'active'
        `);
        console.log('     ✅ Created project_interactions view');

        // Check final status
        console.log('\n📈 Project isolation status:');
        
        const checkTables = [
            'participant_topic_turns',
            'public_interactions',
            'session_contexts'
        ];

        for (const table of checkTables) {
            try {
                const result = await db.pool.query(`
                    SELECT 
                        COUNT(*) as total_records,
                        COUNT(project_id) as with_project_id,
                        COUNT(*) - COUNT(project_id) as missing_project_id
                    FROM ${table}
                `);
                
                const stats = result.rows[0];
                console.log(`   ${table}:`);
                console.log(`     Total: ${stats.total_records}, With project_id: ${stats.with_project_id}, Missing: ${stats.missing_project_id}`);
            } catch (error) {
                console.log(`   ${table}: Error checking - ${error.message}`);
            }
        }

        console.log('\n🎉 Project isolation completed!');
        console.log('\n⚠️  Next steps:');
        console.log('   1. Update daily_embeddings.py to set project_id when creating embeddings');
        console.log('   2. Update MCP server queries to filter by project context');
        console.log('   3. Test cross-project isolation');
        console.log('   4. You can now safely drop cogito_multi database');

    } catch (error) {
        console.error('❌ Project isolation failed:', error);
        throw error;
    } finally {
        await db.close();
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    addProjectIsolation()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('Project isolation failed:', error);
            process.exit(1);
        });
}

export { addProjectIsolation };
#!/usr/bin/env node

/**
 * Migrate Data to Cogito Database
 * Simple data migration from cogito_multi to cogito
 */

import pg from 'pg';
const { Pool } = pg;

const cogitoMulti = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'cogito_multi',
    user: 'ken',
    password: '7297'
});

const cogito = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'cogito',
    user: 'ken',
    password: '7297'
});

async function migrateData() {
    console.log('📊 Migrating data from cogito_multi to cogito...');
    
    try {
        // Migrate projects
        console.log('   Migrating projects...');
        const projects = await cogitoMulti.query('SELECT * FROM projects');
        for (const project of projects.rows) {
            // Merge all extra fields into project_config for cogito schema
            const project_config = {
                core_purpose: project.core_purpose,
                target_users: project.target_users,
                key_technologies: project.key_technologies,
                project_philosophy: project.project_philosophy,
                communication_style: project.communication_style,
                maturity_level: project.maturity_level,
                ...project.metadata
            };
            
            await cogito.query(`
                INSERT INTO projects (id, name, display_name, description, repository_path, status, 
                    project_config, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (name) DO NOTHING
            `, [
                project.id, project.name, project.display_name, project.description,
                project.repository_path, project.status, project_config,
                project.created_at, project.updated_at
            ]);
        }
        console.log(`     ✅ Migrated ${projects.rows.length} projects`);

        // Migrate personalities
        console.log('   Migrating personality_instances...');
        const personalities = await cogitoMulti.query('SELECT * FROM personality_instances');
        for (const personality of personalities.rows) {
            await cogito.query(`
                INSERT INTO personality_instances (id, name, domain, collaborator, created_from_base,
                    specialization, status, current_config, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT (collaborator, domain) DO NOTHING
            `, [
                personality.id, personality.name, personality.domain, personality.collaborator,
                personality.created_from_base, personality.specialization, personality.status,
                personality.current_config, personality.created_at, personality.updated_at
            ]);
        }
        console.log(`     ✅ Migrated ${personalities.rows.length} personalities`);

        // Migrate personality project assignments
        console.log('   Migrating personality_project_assignments...');
        const assignments = await cogitoMulti.query('SELECT * FROM personality_project_assignments');
        for (const assignment of assignments.rows) {
            await cogito.query(`
                INSERT INTO personality_project_assignments (personality_instance_id, project_id, role, created_at)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (personality_instance_id, project_id) DO NOTHING
            `, [
                assignment.personality_instance_id, assignment.project_id,
                assignment.role, assignment.created_at
            ]);
        }
        console.log(`     ✅ Migrated ${assignments.rows.length} personality assignments`);

        // Check final counts
        console.log();
        console.log('📈 Final counts in cogito database:');
        
        const tables = ['projects', 'personality_instances', 'participant_topic_turns'];
        for (const table of tables) {
            const result = await cogito.query(`SELECT COUNT(*) FROM ${table}`);
            console.log(`   ${table}: ${result.rows[0].count} records`);
        }

        console.log();
        console.log('🎉 Data migration completed!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await cogito.end();
        await cogitoMulti.end();
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    migrateData()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('Migration failed:', error);
            process.exit(1);
        });
}

export { migrateData };
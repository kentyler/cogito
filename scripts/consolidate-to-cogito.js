#!/usr/bin/env node

/**
 * Consolidate to Cogito Database
 * Migrates all data from cogito_multi to cogito database
 * Keeps existing embeddings in cogito intact
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connections
const cogito = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'cogito',
    user: 'cogito',
    password: '7297'
});

const cogitoMulti = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'cogito_multi',
    user: 'ken',
    password: '7297'
});

async function consolidateToCogito() {
    console.log('🔄 Consolidating to cogito database...');
    console.log('   Source: cogito_multi (comprehensive tables)');
    console.log('   Target: cogito (preserving existing embeddings)');
    console.log();
    
    try {
        // Step 1: Add missing schema to cogito database
        console.log('📋 Adding missing schema to cogito database...');
        const schemaPath = path.join(__dirname, '../setup-cogito-database.py');
        
        // We'll add the core tables that don't exist in cogito
        const missingTables = `
-- Add missing tables from cogito_multi to cogito

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    repository_path VARCHAR(500),
    status VARCHAR(50) DEFAULT 'active',
    core_purpose TEXT NOT NULL,
    target_users TEXT[],
    key_technologies TEXT[],
    project_philosophy TEXT,
    communication_style VARCHAR(100),
    maturity_level VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Personality instances
CREATE TABLE IF NOT EXISTS personality_instances (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    domain VARCHAR(100) NOT NULL,
    collaborator VARCHAR(100) NOT NULL,
    created_from_base VARCHAR(100),
    specialization TEXT,
    status VARCHAR(50) DEFAULT 'active',
    current_config JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(collaborator, domain)
);

-- Public interactions
CREATE TABLE IF NOT EXISTS public_interactions (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    collaborator VARCHAR(100) NOT NULL,
    human_input TEXT NOT NULL,
    spokesperson_response TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    interaction_type VARCHAR(50),
    context_tags TEXT[],
    deliberation_id BIGINT
);

-- Internal deliberations
CREATE TABLE IF NOT EXISTS internal_deliberations (
    id BIGSERIAL PRIMARY KEY,
    public_interaction_id BIGINT REFERENCES public_interactions(id),
    session_id VARCHAR(100) NOT NULL,
    participants BIGINT[] NOT NULL,
    active_coordinator BIGINT REFERENCES personality_instances(id),
    input_analysis JSONB,
    initial_responses JSONB,
    conflicts_detected JSONB,
    evaporation_attempts JSONB,
    final_synthesis JSONB,
    insights_gained JSONB,
    new_patterns_detected JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Personality project assignments
CREATE TABLE IF NOT EXISTS personality_project_assignments (
    personality_instance_id BIGINT REFERENCES personality_instances(id) ON DELETE CASCADE,
    project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'spokesperson',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (personality_instance_id, project_id)
);

-- Other important tables
CREATE TABLE IF NOT EXISTS complexity_indicators (
    id BIGSERIAL PRIMARY KEY,
    collaborator VARCHAR(100) NOT NULL,
    conflicting_requests INTEGER DEFAULT 0,
    domain_switches_per_session DECIMAL,
    evaporation_opportunities INTEGER DEFAULT 0,
    liminal_observations_backlog INTEGER DEFAULT 0,
    upgrade_proposed BOOLEAN DEFAULT FALSE,
    upgrade_approved BOOLEAN DEFAULT FALSE,
    upgrade_completed BOOLEAN DEFAULT FALSE,
    measured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS evaporation_patterns (
    id BIGSERIAL PRIMARY KEY,
    conflict_type VARCHAR(100) NOT NULL,
    pattern_description TEXT NOT NULL,
    successful_synthesis JSONB NOT NULL,
    conditions_required JSONB,
    reuse_count INTEGER DEFAULT 0,
    successful_applications BIGINT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);
CREATE INDEX IF NOT EXISTS idx_personality_instances_collaborator ON personality_instances(collaborator);
CREATE INDEX IF NOT EXISTS idx_personality_instances_domain ON personality_instances(domain);
CREATE INDEX IF NOT EXISTS idx_public_interactions_session ON public_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_public_interactions_collaborator ON public_interactions(collaborator);
`;

        await cogito.query(missingTables);
        console.log('✅ Schema added to cogito database');

        // Step 2: Migrate data from cogito_multi to cogito
        console.log('📊 Migrating data from cogito_multi...');
        
        const tables = [
            'projects',
            'personality_instances', 
            'public_interactions',
            'internal_deliberations',
            'personality_project_assignments',
            'complexity_indicators',
            'evaporation_patterns'
        ];

        for (const table of tables) {
            try {
                console.log(`   Migrating ${table}...`);
                
                // Get data from cogito_multi
                const result = await cogitoMulti.query(`SELECT * FROM ${table}`);
                
                if (result.rows.length === 0) {
                    console.log(`     No data in ${table}`);
                    continue;
                }
                
                // Get column names
                const columns = Object.keys(result.rows[0]);
                const columnNames = columns.join(', ');
                const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
                
                // Insert into cogito
                for (const row of result.rows) {
                    const values = columns.map(col => row[col]);
                    await cogito.query(
                        `INSERT INTO ${table} (${columnNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
                        values
                    );
                }
                
                console.log(`     ✅ Migrated ${result.rows.length} records from ${table}`);
                
            } catch (error) {
                console.log(`     ⚠️  Error migrating ${table}: ${error.message}`);
            }
        }

        console.log();
        console.log('🎉 Consolidation completed!');
        console.log();
        console.log('📈 Final status:');
        
        // Check record counts
        const tables_to_check = [
            'projects',
            'personality_instances',
            'participant_topic_turns',
            'public_interactions',
            'identities'
        ];
        
        for (const table of tables_to_check) {
            try {
                const result = await cogito.query(`SELECT COUNT(*) FROM ${table}`);
                console.log(`   ${table}: ${result.rows[0].count} records`);
            } catch (error) {
                console.log(`   ${table}: table not found`);
            }
        }
        
        console.log();
        console.log('⚠️  Next steps:');
        console.log('   1. Update MCP server database config to use cogito');
        console.log('   2. Add project_id columns for project isolation');
        console.log('   3. Test MCP server functionality');
        console.log('   4. Drop cogito_multi database when confirmed working');

    } catch (error) {
        console.error('❌ Consolidation failed:', error);
        throw error;
    } finally {
        await cogito.end();
        await cogitoMulti.end();
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    consolidateToCogito()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('Consolidation failed:', error);
            process.exit(1);
        });
}

export { consolidateToCogito };
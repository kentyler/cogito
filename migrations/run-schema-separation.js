#!/usr/bin/env node

import { DatabaseManager } from './lib/database.js';
import fs from 'fs/promises';
import path from 'path';

const db = new DatabaseManager();

async function runSchemaSeparation() {
    try {
        console.log('🏗️  Running schema separation migration...\n');
        
        // Read the migration SQL
        const migrationPath = path.join(process.cwd(), 'migrations', '009_schema_separation.sql');
        const migrationSQL = await fs.readFile(migrationPath, 'utf8');
        
        // Execute the migration
        console.log('Executing schema separation...');
        await db.pool.query(migrationSQL);
        
        console.log('✅ Schema separation completed successfully\n');
        
        // Verify the separation
        console.log('Verifying schema separation...\n');
        
        // Check tables in each schema
        const clientTables = await db.pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'client_mgmt'
            ORDER BY table_name
        `);
        
        const conversationTables = await db.pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'conversation'
            ORDER BY table_name
        `);
        
        const publicTables = await db.pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `);
        
        console.log('📊 Schema Distribution:');
        console.log(`\n🏢 client_mgmt schema (${clientTables.rows.length} tables):`);
        clientTables.rows.forEach(row => console.log(`   - ${row.table_name}`));
        
        console.log(`\n💬 conversation schema (${conversationTables.rows.length} tables):`);
        conversationTables.rows.forEach(row => console.log(`   - ${row.table_name}`));
        
        console.log(`\n🌐 public schema (${publicTables.rows.length} tables remaining):`);
        publicTables.rows.forEach(row => console.log(`   - ${row.table_name}`));
        
        // Test cross-schema views
        console.log('\n🔗 Testing cross-schema views...');
        
        const viewTest = await db.pool.query(`
            SELECT COUNT(*) as participant_count
            FROM public.participant_users
        `);
        console.log(`   participant_users view: ${viewTest.rows[0].participant_count} records`);
        
        const blocksTest = await db.pool.query(`
            SELECT COUNT(*) as block_count
            FROM public.client_blocks
        `);
        console.log(`   client_blocks view: ${blocksTest.rows[0].block_count} records`);
        
        // Test that conversation analyzer still works
        console.log('\n🧪 Testing conversation analyzer compatibility...');
        
        // Test a simple query that should work with search_path
        const turnTest = await db.pool.query(`
            SELECT COUNT(*) as turn_count FROM turns
        `);
        console.log(`   turns table accessible: ${turnTest.rows[0].turn_count} records`);
        
        const participantTest = await db.pool.query(`
            SELECT COUNT(*) as participant_count FROM participants
        `);
        console.log(`   participants table accessible: ${participantTest.rows[0].participant_count} records`);
        
        // Test cross-schema reference
        const userJoinTest = await db.pool.query(`
            SELECT COUNT(*) as join_count 
            FROM conversation.participants p 
            JOIN client_mgmt.users u ON p.user_id = u.id
        `);
        console.log(`   cross-schema joins working: ${userJoinTest.rows[0].join_count} records`);
        
        console.log('\n✅ All tests passed! Schema separation successful.');
        
        console.log('\n📝 Summary:');
        console.log('- Business/auth tables moved to client_mgmt schema');
        console.log('- Conversation/analysis tables moved to conversation schema'); 
        console.log('- Cross-schema foreign keys maintained');
        console.log('- Views created for convenient cross-schema queries');
        console.log('- Search path updated for backwards compatibility');
        
        console.log('\n🔄 Next Steps:');
        console.log('1. Update application code to use schema prefixes where needed');
        console.log('2. Test all application functionality');
        console.log('3. Consider updating conversation analyzer imports');
        
    } catch (err) {
        console.error('❌ Schema separation failed:', err.message);
        if (err.stack) {
            console.error('Stack:', err.stack);
        }
        console.error('\nPlease check the error and try again.');
    } finally {
        await db.close();
    }
}

runSchemaSeparation();
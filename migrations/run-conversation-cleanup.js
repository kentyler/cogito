#!/usr/bin/env node

import { DatabaseManager } from './lib/database.js';
import fs from 'fs/promises';
import path from 'path';

const db = new DatabaseManager();

async function runConversationCleanup() {
    try {
        console.log('🧹 Running final conversation tables cleanup...\n');
        
        // Read the cleanup migration SQL
        const migrationPath = path.join(process.cwd(), 'migrations', '008_remove_conversation_tables.sql');
        const migrationSQL = await fs.readFile(migrationPath, 'utf8');
        
        // Execute the cleanup
        console.log('Executing cleanup migration...');
        await db.pool.query(migrationSQL);
        
        console.log('✅ Cleanup completed successfully\n');
        
        // Verify the cleanup
        console.log('Verifying cleanup results...\n');
        
        // Check that conversation tables are gone
        const remainingTables = await db.pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
              AND table_name LIKE 'conversation%'
              AND table_name != 'conversation_tables_final_backup'
        `);
        
        if (remainingTables.rows.length === 0) {
            console.log('✅ All conversation tables successfully removed');
        } else {
            console.log('⚠️  Some conversation tables remain:');
            remainingTables.rows.forEach(row => console.log('   -', row.table_name));
        }
        
        // Check blocks/turns statistics
        const stats = await db.pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM blocks) as block_count,
                (SELECT COUNT(*) FROM turns) as turn_count,
                (SELECT COUNT(*) FROM participants WHERE metadata->'patterns' IS NOT NULL) as participants_with_patterns,
                (SELECT COUNT(*) FROM conversation_tables_final_backup) as backup_records
        `);
        
        const s = stats.rows[0];
        console.log('\n📊 Final Statistics:');
        console.log(`   Blocks: ${s.block_count}`);
        console.log(`   Turns: ${s.turn_count}`);
        console.log(`   Participants with patterns: ${s.participants_with_patterns}`);
        console.log(`   Backup records: ${s.backup_records}`);
        
        // Test the new analyzer still works
        console.log('\n🧪 Testing analyzer after cleanup...');
        
        // Import and test the analyzer
        const { testAnalyzeIanEmail } = await import('./lib/conversation-pattern-analyzer.js');
        const testResult = await testAnalyzeIanEmail();
        
        if (testResult) {
            console.log('✅ Analyzer working correctly with new architecture');
        }
        
        console.log('\n🎉 Migration complete! Conversation tables successfully removed.');
        console.log('\nNext steps:');
        console.log('1. Update any remaining scripts that reference conversation tables');
        console.log('2. Remove old analyzer backup file when confident');
        console.log('3. The blocks/turns architecture is now the only system');
        
    } catch (err) {
        console.error('❌ Cleanup failed:', err.message);
        if (err.stack) {
            console.error('Stack:', err.stack);
        }
        console.error('\nPlease check the error and try again.');
    } finally {
        await db.close();
    }
}

runConversationCleanup();
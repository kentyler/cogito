#!/usr/bin/env node

import { DatabaseManager } from './lib/database.js';
import { readFileSync } from 'fs';

const db = new DatabaseManager();

async function runMigration() {
    try {
        console.log('Running migration to loosen pattern constraints...\n');
        
        const sql = readFileSync('./migrations/loosen-pattern-constraints.sql', 'utf8');
        
        // Split by semicolons, being careful about functions
        const statements = sql.split(/;\s*$/gm).filter(s => s.trim());
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i].trim();
            if (statement && !statement.startsWith('--')) {
                try {
                    console.log(`Executing statement ${i + 1}...`);
                    await db.pool.query(statement);
                    console.log('✓ Success\n');
                } catch (err) {
                    console.error('✗ Error:', err.message);
                    if (err.message.includes('already exists')) {
                        console.log('  (Constraint already exists, continuing...)\n');
                    } else {
                        console.log('  Statement:', statement.substring(0, 100) + '...\n');
                    }
                }
            }
        }
        
        console.log('Migration complete!');
        
    } catch (err) {
        console.error('Fatal error:', err);
    } finally {
        await db.close();
    }
}

runMigration();
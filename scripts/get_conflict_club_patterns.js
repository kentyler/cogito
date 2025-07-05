#!/usr/bin/env node

import { DatabaseManager } from '../lib/database.js';

async function getConflictClubPatterns() {
    const db = new DatabaseManager();
    
    try {
        const members = ['Karl Perry', 'Kenneth Tyler', 'Linden Vazey', 'Ian Palonis', 'Julian Andrews', 'Bruno Guardia'];
        
        console.log('Conflict Club Member Patterns:\n');
        
        for (const member of members) {
            const result = await db.pool.query(`
                SELECT name, metadata->'personality_patterns' as patterns
                FROM participants 
                WHERE name = $1
            `, [member]);
            
            if (result.rows.length > 0) {
                const participant = result.rows[0];
                console.log(`${participant.name}:`);
                
                if (participant.patterns) {
                    const patterns = participant.patterns;
                    for (const [pattern, data] of Object.entries(patterns)) {
                        console.log(`  - ${pattern}: ${data.description || 'No description'} (${Math.round((data.confidence || 0) * 100)}%)`);
                    }
                } else {
                    console.log('  No patterns recorded yet');
                }
                console.log();
            }
        }
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await db.close();
    }
}

getConflictClubPatterns();
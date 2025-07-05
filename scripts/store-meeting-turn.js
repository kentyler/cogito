#!/usr/bin/env node
/**
 * Store Meeting Turn - Database Helper
 * Called by Python meeting processor to store conversation turns
 */

import { DatabaseManager } from './lib/database.js';

async function storeMeetingTurn() {
    if (process.argv.length < 5) {
        console.error('Usage: node store-meeting-turn.js <session_id> <content> <interaction_type> [client_id]');
        process.exit(1);
    }

    const [, , sessionId, content, interactionType, clientId = 8] = process.argv;

    const db = new DatabaseManager();
    
    try {
        // Insert into turns table
        const turnQuery = `
            INSERT INTO turns 
            (participant_id, content, source_type, metadata, timestamp)
            VALUES ($1, $2, $3, $4, NOW())
            RETURNING turn_id
        `;
        
        const turnResult = await db.pool.query(turnQuery, [
            null, // No participant tracking - privacy first
            content,
            interactionType,
            { 
                session_id: sessionId, 
                client_id: parseInt(clientId), 
                project_id: 1,
                source: 'meeting_processor',
                speaker_role: 'meeting_participant' // Role-based instead of identity
            }
        ]);
        
        const turnId = turnResult.rows[0].turn_id;
        
        // Find or create block for this session
        let blockResult = await db.pool.query(
            `SELECT block_id FROM blocks WHERE metadata->>'session_id' = $1 AND block_type = 'meeting'`,
            [sessionId]
        );
        
        let blockId;
        if (blockResult.rows.length === 0) {
            // Create new meeting block
            const newBlock = await db.pool.query(
                `INSERT INTO blocks (name, block_type, metadata) 
                 VALUES ($1, 'meeting', $2) RETURNING block_id`,
                [`Meeting: ${sessionId}`, { session_id: sessionId, created_by: 'meeting_processor' }]
            );
            blockId = newBlock.rows[0].block_id;
        } else {
            blockId = blockResult.rows[0].block_id;
        }
        
        // Get sequence order and link turn to block
        const sequenceResult = await db.pool.query(
            'SELECT COALESCE(MAX(sequence_order), 0) + 1 as next_order FROM block_turns WHERE block_id = $1',
            [blockId]
        );
        
        await db.pool.query(
            'INSERT INTO block_turns (block_id, turn_id, sequence_order) VALUES ($1, $2, $3)',
            [blockId, turnId, sequenceResult.rows[0].next_order]
        );
        
        console.log(`✅ Stored ${interactionType} turn (ID: ${turnId}) in block ${blockId}`);
        
    } catch (error) {
        console.error(`❌ Error storing turn: ${error.message}`);
        process.exit(1);
    } finally {
        await db.pool.end();
    }
}

storeMeetingTurn();
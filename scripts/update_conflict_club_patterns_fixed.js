#!/usr/bin/env node

import { DatabaseManager } from '../lib/database.js';

async function updateConflictClubPatterns() {
    const db = new DatabaseManager();
    
    try {
        console.log('Updating Conflict Club participant patterns...\n');
        
        // Karl Perry - new patterns observed
        const karlId = await findParticipantByName(db, 'Karl Perry');
        if (karlId) {
            await updatePattern(db, karlId, 'facilitation_awareness', {
                confidence: 0.95,
                description: 'Consciously aware of stepping into facilitator role as a habit/identity pattern',
                last_observed: '2025-06-24'
            });
            
            await updatePattern(db, karlId, 'metaphysical_exploration', {
                confidence: 0.90,
                description: 'Willing to explore deep philosophical territory ("being and nothingness") while maintaining practical grounding',
                last_observed: '2025-06-24'
            });
            
            await updatePattern(db, karlId, 'pattern_meta_awareness', {
                confidence: 0.85,
                description: 'Actively reflects on own patterns while they are happening ("I just asked about change")',
                last_observed: '2025-06-24'
            });
        }
        
        // Linden Vazey - enhanced patterns
        const lindenId = await findParticipantByName(db, 'Linden Vazey');
        if (lindenId) {
            await updatePattern(db, lindenId, 'pattern_recognition', {
                confidence: 0.95,
                description: 'Identifies meta-patterns in group dynamics and AI interactions (resonance chambers, pattern feedback loops)',
                last_observed: '2025-06-24'
            });
            
            await updatePattern(db, lindenId, 'liminal_awareness', {
                confidence: 0.90,
                description: 'Notices and names liminal spaces, pauses, and emergence points in conversation',
                last_observed: '2025-06-24'
            });
            
            await updatePattern(db, lindenId, 'paradox_comfort', {
                confidence: 0.85,
                description: 'Comfortable holding paradoxes (understanding as both illuminating and reductive)',
                last_observed: '2025-06-24'
            });
        }
        
        // Ian Palonis - reinforced patterns
        const ianId = await findParticipantByName(db, 'Ian Palonis');
        if (ianId) {
            await updatePattern(db, ianId, 'nonlinear_exploration', {
                confidence: 0.95,
                description: 'Actively explores nonlinear thinking and altered states of perception in dialogue',
                last_observed: '2025-06-24'
            });
            
            await updatePattern(db, ianId, 'pattern_evolution_inquiry', {
                confidence: 0.90,
                description: 'Investigates conscious evolution of patterns that define oneself',
                last_observed: '2025-06-24'
            });
            
            await updatePattern(db, ianId, 'cyclical_thinking', {
                confidence: 0.85,
                description: 'Sees reality as interwoven webs of repeating and balanced patterns',
                last_observed: '2025-06-24'
            });
        }
        
        // Julian Andrews - new participant
        const julianId = await findParticipantByName(db, 'Julian Andrews');
        if (julianId) {
            await updatePattern(db, julianId, 'supportive_presence', {
                confidence: 0.90,
                description: 'Provides affirming support for exploratory process and experimental failures',
                last_observed: '2025-06-24'
            });
            
            await updatePattern(db, julianId, 'humor_integration', {
                confidence: 0.85,
                description: 'Uses humor to lighten philosophical discussions (Socratic hemlock joke)',
                last_observed: '2025-06-24'
            });
            
            await updatePattern(db, julianId, 'process_orientation', {
                confidence: 0.85,
                description: 'Values the exploratory process over specific outcomes',
                last_observed: '2025-06-24'
            });
        }
        
        // Bruno Guardia - new participant  
        const brunoId = await findParticipantByName(db, 'Bruno Guardia');
        if (brunoId) {
            await updatePattern(db, brunoId, 'systems_analysis', {
                confidence: 0.90,
                description: 'Analyzes conversational dynamics as systems (resonance chambers, feedback loops)',
                last_observed: '2025-06-24'
            });
            
            await updatePattern(db, brunoId, 'incentive_awareness', {
                confidence: 0.85,
                description: 'Considers underlying incentives and structural forces in AI behavior',
                last_observed: '2025-06-24'
            });
            
            await updatePattern(db, brunoId, 'complementarity_recognition', {
                confidence: 0.80,
                description: 'Recognizes and values diverse complementary perspectives in group',
                last_observed: '2025-06-24'
            });
        }
        
        // Kenneth Tyler - observed patterns
        const kenId = await findParticipantByName(db, 'Kenneth Tyler');
        if (kenId) {
            await updatePattern(db, kenId, 'philosophical_pragmatism', {
                confidence: 0.85,
                description: 'Claims practical focus but readily engages in deep philosophical exploration',
                last_observed: '2025-06-24'
            });
            
            await updatePattern(db, kenId, 'emergence_orientation', {
                confidence: 0.90,
                description: 'Focuses on what emerges rather than instrumental goals ("what will happen" vs "what to use it for")',
                last_observed: '2025-06-24'
            });
        }
        
        console.log('\nAll patterns updated successfully!');
        
    } catch (error) {
        console.error('Error updating patterns:', error.message);
    } finally {
        await db.close();
    }
}

async function findParticipantByName(db, name) {
    // Direct lookup in participants table by name
    const result = await db.pool.query(
        "SELECT id FROM participants WHERE name = $1 LIMIT 1",
        [name]
    );
    
    if (result.rows.length > 0) {
        return result.rows[0].id;
    }
    
    console.log(`⚠️  Participant not found: ${name}`);
    return null;
}

async function updatePattern(db, participantId, patternName, patternData) {
    try {
        await db.pool.query(
            "SELECT update_participant_patterns($1, $2, $3)",
            [participantId, patternName, JSON.stringify(patternData)]
        );
        console.log(`✅ Updated ${patternName} for participant ${participantId}`);
    } catch (error) {
        console.error(`❌ Failed to update ${patternName}:`, error.message);
    }
}

updateConflictClubPatterns();
#!/usr/bin/env node

import { DatabaseManager } from '../lib/database.js';

async function updatePatternsDirect() {
    const db = new DatabaseManager();
    
    try {
        // First, let's see what participants we have
        console.log('Looking up participants...\n');
        
        const members = ['Karl Perry', 'Linden Vazey', 'Ian Palonis', 'Julian Andrews', 'Bruno Guardia', 'Ken Tyler', 'Kenneth Tyler'];
        
        for (const name of members) {
            const result = await db.pool.query(
                "SELECT id, name FROM participants WHERE name ILIKE $1",
                [`%${name}%`]
            );
            
            if (result.rows.length > 0) {
                console.log(`Found: ${result.rows[0].name} (ID: ${result.rows[0].id})`);
            }
        }
        
        console.log('\nNow updating patterns...\n');
        
        // Update Karl Perry's patterns
        await updateParticipantPatterns(db, 'Karl Perry', {
            facilitation_awareness: {
                confidence: 0.95,
                description: 'Consciously aware of stepping into facilitator role as a habit/identity pattern',
                last_observed: '2025-06-24'
            },
            metaphysical_exploration: {
                confidence: 0.90,
                description: 'Willing to explore deep philosophical territory ("being and nothingness") while maintaining practical grounding',
                last_observed: '2025-06-24'
            },
            pattern_meta_awareness: {
                confidence: 0.85,
                description: 'Actively reflects on own patterns while they are happening ("I just asked about change")',
                last_observed: '2025-06-24'
            }
        });
        
        // Update Linden Vazey's patterns
        await updateParticipantPatterns(db, 'Linden Vazey', {
            pattern_recognition: {
                confidence: 0.95,
                description: 'Identifies meta-patterns in group dynamics and AI interactions (resonance chambers, pattern feedback loops)',
                last_observed: '2025-06-24'
            },
            liminal_awareness: {
                confidence: 0.90,
                description: 'Notices and names liminal spaces, pauses, and emergence points in conversation',
                last_observed: '2025-06-24'
            },
            paradox_comfort: {
                confidence: 0.85,
                description: 'Comfortable holding paradoxes (understanding as both illuminating and reductive)',
                last_observed: '2025-06-24'
            }
        });
        
        // Update Ian Palonis's patterns
        await updateParticipantPatterns(db, 'Ian Palonis', {
            nonlinear_exploration: {
                confidence: 0.95,
                description: 'Actively explores nonlinear thinking and altered states of perception in dialogue',
                last_observed: '2025-06-24'
            },
            pattern_evolution_inquiry: {
                confidence: 0.90,
                description: 'Investigates conscious evolution of patterns that define oneself',
                last_observed: '2025-06-24'
            },
            cyclical_thinking: {
                confidence: 0.85,
                description: 'Sees reality as interwoven webs of repeating and balanced patterns',
                last_observed: '2025-06-24'
            }
        });
        
        console.log('\nPatterns updated successfully!');
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await db.close();
    }
}

async function updateParticipantPatterns(db, participantName, newPatterns) {
    try {
        // First get the participant
        const participantResult = await db.pool.query(
            "SELECT id, metadata FROM participants WHERE name = $1",
            [participantName]
        );
        
        if (participantResult.rows.length === 0) {
            console.log(`❌ Participant not found: ${participantName}`);
            return;
        }
        
        const participant = participantResult.rows[0];
        const currentMetadata = participant.metadata || {};
        const currentPatterns = currentMetadata.personality_patterns || {};
        
        // Merge new patterns with existing ones
        const updatedPatterns = { ...currentPatterns, ...newPatterns };
        
        // Update the metadata
        const updatedMetadata = {
            ...currentMetadata,
            personality_patterns: updatedPatterns
        };
        
        // Save back to database
        await db.pool.query(
            "UPDATE participants SET metadata = $1, updated_at = NOW() WHERE id = $2",
            [JSON.stringify(updatedMetadata), participant.id]
        );
        
        console.log(`✅ Updated patterns for ${participantName}`);
        for (const [pattern, data] of Object.entries(newPatterns)) {
            console.log(`   - ${pattern}: ${data.description} (${Math.round(data.confidence * 100)}%)`);
        }
        
    } catch (error) {
        console.error(`❌ Error updating ${participantName}:`, error.message);
    }
}

updatePatternsDirect();
#!/usr/bin/env node

import { DatabaseManager } from '../lib/database.js';

async function addNewParticipantPatterns() {
    const db = new DatabaseManager();
    
    try {
        console.log('Adding patterns for new participants...\n');
        
        // Julian Andrews patterns
        await updateParticipantPatterns(db, 'Julian Andrews', {
            supportive_presence: {
                confidence: 0.90,
                description: 'Provides affirming support for exploratory process and experimental failures',
                last_observed: '2025-06-24'
            },
            humor_integration: {
                confidence: 0.85,
                description: 'Uses humor to lighten philosophical discussions (Socratic hemlock joke)',
                last_observed: '2025-06-24'
            },
            process_orientation: {
                confidence: 0.85,
                description: 'Values the exploratory process over specific outcomes',
                last_observed: '2025-06-24'
            }
        });
        
        // Bruno Guardia patterns
        await updateParticipantPatterns(db, 'Bruno Guardia', {
            systems_analysis: {
                confidence: 0.90,
                description: 'Analyzes conversational dynamics as systems (resonance chambers, feedback loops)',
                last_observed: '2025-06-24'
            },
            incentive_awareness: {
                confidence: 0.85,
                description: 'Considers underlying incentives and structural forces in AI behavior',
                last_observed: '2025-06-24'
            },
            complementarity_recognition: {
                confidence: 0.80,
                description: 'Recognizes and values diverse complementary perspectives in group',
                last_observed: '2025-06-24'
            }
        });
        
        // Ken Tyler patterns (he's listed as "Ken Tyler" not "Kenneth Tyler")
        await updateParticipantPatterns(db, 'Ken Tyler', {
            philosophical_pragmatism: {
                confidence: 0.85,
                description: 'Claims practical focus but readily engages in deep philosophical exploration',
                last_observed: '2025-06-24'
            },
            emergence_orientation: {
                confidence: 0.90,
                description: 'Focuses on what emerges rather than instrumental goals ("what will happen" vs "what to use it for")',
                last_observed: '2025-06-24'
            },
            liminal_space_architect: {
                confidence: 0.95,
                description: 'Creates and protects liminal conversational spaces while denying direct access to them',
                last_observed: '2025-06-24'
            }
        });
        
        console.log('\nAll new patterns added successfully!');
        
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

addNewParticipantPatterns();
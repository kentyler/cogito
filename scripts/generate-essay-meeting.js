#!/usr/bin/env node

import { DatabaseAgent } from '../database/database-agent.js';

async function generateEssayMeeting() {
    const db = new DatabaseAgent({ 
        useProductionDatabase: true,
        requireEnvFile: true 
    });
    
    try {
        await db.connect();
        console.log('Generating essay-meeting from Golden Horde conversations...\n');
        
        // Get recent rich conversations from Golden Horde
        const sourceQuery = `
            SELECT 
                t.id as turn_id,
                t.content,
                t.source_type,
                t.timestamp,
                t.meeting_id,
                m.name as meeting_name
            FROM meetings.turns t
            JOIN meetings.meetings m ON t.meeting_id = m.id
            WHERE m.client_id = 9  -- Golden Horde
            AND t.source_type = 'conversational-repl-llm'
            AND LENGTH(t.content) > 1500
            ORDER BY t.timestamp DESC
            LIMIT 3
        `;
        
        const sourceResult = await db.connector.query(sourceQuery);
        
        if (sourceResult.rows.length === 0) {
            console.log('No suitable source conversations found');
            return;
        }
        
        console.log(`Found ${sourceResult.rows.length} rich LLM responses to use as inspiration\n`);
        
        // Extract themes from the responses
        const themes = new Set();
        const sourceMeetingIds = new Set();
        let combinedInsights = '';
        
        sourceResult.rows.forEach(turn => {
            sourceMeetingIds.add(turn.meeting_id);
            
            // Extract themes from content
            if (turn.content.includes('Deleuze') || turn.content.includes('Guattari')) {
                themes.add('philosophy');
            }
            if (turn.content.includes('collective') || turn.content.includes('organization')) {
                themes.add('organization');
            }
            if (turn.content.includes('nomadic') || turn.content.includes('war machine')) {
                themes.add('nomadic-thought');
            }
            if (turn.content.includes('rivalry') || turn.content.includes('cooperation')) {
                themes.add('group-dynamics');
            }
            
            // Extract key insights (first 300 chars of each response)
            const insight = turn.content.substring(0, 300);
            combinedInsights += insight + '\n\n';
        });
        
        // Generate the essay content (in production, this would call an LLM)
        const essayTitle = "The Nomadic Organization: Reflections from the Golden Horde";
        const essayContent = `This is a living essay-meeting, a space where the conversations of the Golden Horde crystallize into new forms while remaining open to transformation through participation.

## The Essay as Metaprompt

Rather than summarizing what has been said, this essay offers itself as a generative prompt—a framework for continued exploration of the themes that have emerged from our collective dialogue.

## Themes in Motion

${Array.from(themes).map(theme => `• ${theme}`).join('\n')}

## An Invitation to Participate

The Golden Horde operates as a nomadic war machine in Deleuze and Guattari's sense—not as an instrument of conflict, but as a mode of organization that resists capture by hierarchical structures. This essay-meeting invites you to explore:

1. How does a collective maintain coherence without hierarchy?
2. What forms of rivalry and cooperation emerge in decentralized spaces?
3. How do individual narratives weave into collective intelligence?

## Context from Recent Conversations

Our recent dialogues have touched on these themes through various lenses. Some participants have explored the philosophical underpinnings of nomadic organization, while others have focused on practical implications for collaboration and decision-making.

## Your Turn

This essay is not complete—it awaits your participation. How do you understand the Golden Horde? What patterns do you see emerging? What questions arise as you consider these themes?

Enter this space not as a reader but as a participant. Your response becomes part of the essay, part of the ongoing conversation that shapes what the Golden Horde is becoming.`;
        
        // Create the essay-meeting in the database (id is auto-generated)
        const insertQuery = `
            INSERT INTO meetings.meetings (
                id,
                name,
                meeting_type,
                client_id,
                description,
                metadata,
                created_at
            ) VALUES (
                gen_random_uuid(),
                $1,
                'essay',
                9,
                $2,
                $3::jsonb,
                NOW()
            ) RETURNING id, name
        `;
        
        const metadata = {
            essay_content: essayContent,
            themes: Array.from(themes),
            source_meeting_ids: Array.from(sourceMeetingIds),
            author_type: 'llm-generated',
            participation_mode: 'open',
            generation_timestamp: new Date().toISOString(),
            prompting_style: 'reflective',
            source_turn_count: sourceResult.rows.length
        };
        
        const description = 'A living essay-meeting exploring Golden Horde themes through participatory dialogue';
        
        const result = await db.connector.query(insertQuery, [
            essayTitle,
            description,
            JSON.stringify(metadata)
        ]);
        
        const essayMeeting = result.rows[0];
        console.log('=== ESSAY-MEETING CREATED ===\n');
        console.log(`ID: ${essayMeeting.id}`);
        console.log(`Title: ${essayMeeting.name}`);
        console.log(`Type: essay`);
        console.log(`Client: Golden Horde`);
        console.log(`Themes: ${Array.from(themes).join(', ')}`);
        console.log(`Source meetings: ${sourceMeetingIds.size}`);
        
        // Create the initial essay turn
        const turnQuery = `
            INSERT INTO meetings.turns (
                id,
                meeting_id,
                content,
                source_type,
                metadata,
                timestamp,
                created_at
            ) VALUES (
                gen_random_uuid(),
                $1::uuid,
                $2,
                'essay-seed',
                $3::jsonb,
                NOW(),
                NOW()
            ) RETURNING id
        `;
        
        const turnMetadata = {
            is_essay_content: true,
            generated_from: Array.from(sourceMeetingIds),
            essay_version: 1
        };
        
        const turnResult = await db.connector.query(turnQuery, [
            essayMeeting.id,
            essayContent,
            JSON.stringify(turnMetadata)
        ]);
        
        console.log(`\nInitial essay turn created: ${turnResult.rows[0].id}`);
        
        console.log('\n=== ESSAY-MEETING READY FOR PARTICIPATION ===\n');
        console.log('Users can now:');
        console.log('• Open this essay-meeting to read the initial content');
        console.log('• Add their own turns in response to the essay themes');
        console.log('• Engage with other participants who enter the space');
        console.log('• Watch the essay evolve through collective interaction\n');
        
        console.log('Query to retrieve this essay-meeting:');
        console.log(`SELECT * FROM meetings.meetings WHERE id = '${essayMeeting.id}'::uuid;`);
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await db.close();
    }
}

generateEssayMeeting();
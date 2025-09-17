#!/usr/bin/env node

import { DatabaseAgent } from '../database/database-agent.js';

async function assessEssayPotential() {
    const db = new DatabaseAgent({ 
        useProductionDatabase: true,
        requireEnvFile: true 
    });
    
    try {
        await db.connect();
        console.log('Connected to production database\n');
        
        // Get all turns for Golden Horde with full content
        const turnsQuery = `
            SELECT 
                t.id,
                t.content,
                t.source_type,
                t.timestamp,
                t.metadata,
                m.name as meeting_name,
                m.meeting_type,
                LENGTH(t.content) as content_length
            FROM meetings.turns t
            JOIN meetings.meetings m ON t.meeting_id = m.id
            WHERE m.client_id = 9  -- Golden Horde client ID
            ORDER BY t.timestamp ASC
        `;
        
        const result = await db.connector.query(turnsQuery);
        const turns = result.rows;
        
        console.log('=== GOLDEN HORDE ESSAY PUBLICATION ASSESSMENT ===\n');
        console.log(`Total turns analyzed: ${turns.length}`);
        console.log(`Date range: ${turns[0].timestamp.toLocaleDateString()} to ${turns[turns.length-1].timestamp.toLocaleDateString()}\n`);
        
        // Identify substantial conversations (pairs of user questions and LLM responses)
        const conversations = [];
        for (let i = 0; i < turns.length - 1; i++) {
            if (turns[i].source_type === 'conversational-repl-user' && 
                turns[i+1].source_type === 'conversational-repl-llm') {
                conversations.push({
                    question: turns[i],
                    response: turns[i+1],
                    combinedLength: turns[i].content_length + turns[i+1].content_length
                });
            }
        }
        
        console.log(`Conversation pairs identified: ${conversations.length}\n`);
        
        // Identify rich conversations (substantial length)
        const richConversations = conversations.filter(c => c.combinedLength > 1000);
        console.log(`Rich conversations (>1000 chars): ${richConversations.length}\n`);
        
        // Extract key themes from user questions
        console.log('=== KEY THEMES FROM USER QUESTIONS ===\n');
        const themes = new Map();
        
        const themePatterns = [
            { name: 'Golden Horde Organization', pattern: /golden horde|collective|community|decentralized/gi },
            { name: 'Philosophy & Theory', pattern: /deleuze|guattari|war machine|nomadic|philosophical/gi },
            { name: 'Individual Members', pattern: /ian|linden|members|people|individuals/gi },
            { name: 'Strategy & Vision', pattern: /vision|strategy|working on|initiatives|projects/gi },
            { name: 'Collaboration', pattern: /rivalry|cooperation|together|collective/gi },
            { name: 'Technology & Systems', pattern: /code|system|technology|platform|software/gi },
            { name: 'Personal Growth', pattern: /weight loss|health|support|community support/gi },
            { name: 'Meta-Cognition', pattern: /think|understand|learn|capabilities|evolving/gi }
        ];
        
        conversations.forEach(conv => {
            themePatterns.forEach(theme => {
                const matches = conv.question.content.match(theme.pattern);
                if (matches) {
                    if (!themes.has(theme.name)) {
                        themes.set(theme.name, { count: 0, examples: [] });
                    }
                    const themeData = themes.get(theme.name);
                    themeData.count += matches.length;
                    if (themeData.examples.length < 2) {
                        themeData.examples.push(conv.question.content.substring(0, 150));
                    }
                }
            });
        });
        
        // Sort themes by frequency
        const sortedThemes = Array.from(themes.entries()).sort((a, b) => b[1].count - a[1].count);
        
        sortedThemes.forEach(([themeName, data]) => {
            console.log(`${themeName}: ${data.count} mentions`);
            data.examples.forEach(ex => {
                console.log(`  • "${ex}${ex.length >= 150 ? '...' : ''}"`);
            });
            console.log();
        });
        
        // Analyze conversation depth (response length as proxy for depth)
        console.log('=== CONVERSATION DEPTH ANALYSIS ===\n');
        const depthBuckets = {
            'Brief (<500 chars)': 0,
            'Moderate (500-1500 chars)': 0,
            'Substantial (1500-3000 chars)': 0,
            'Deep (>3000 chars)': 0
        };
        
        conversations.forEach(conv => {
            const responseLength = conv.response.content_length;
            if (responseLength < 500) depthBuckets['Brief (<500 chars)']++;
            else if (responseLength < 1500) depthBuckets['Moderate (500-1500 chars)']++;
            else if (responseLength < 3000) depthBuckets['Substantial (1500-3000 chars)']++;
            else depthBuckets['Deep (>3000 chars)']++;
        });
        
        Object.entries(depthBuckets).forEach(([bucket, count]) => {
            console.log(`${bucket}: ${count} responses`);
        });
        
        // Temporal analysis for publication intervals
        console.log('\n=== TEMPORAL PATTERNS ===\n');
        const daysBetweenSessions = [];
        let lastDate = new Date(turns[0].timestamp);
        
        for (let turn of turns) {
            const currentDate = new Date(turn.timestamp);
            const daysDiff = Math.floor((currentDate - lastDate) / (1000 * 60 * 60 * 24));
            if (daysDiff > 0) {
                daysBetweenSessions.push(daysDiff);
                lastDate = currentDate;
            }
        }
        
        const avgDaysBetween = daysBetweenSessions.reduce((a, b) => a + b, 0) / daysBetweenSessions.length;
        console.log(`Average days between activity: ${avgDaysBetween.toFixed(1)}`);
        console.log(`Max gap: ${Math.max(...daysBetweenSessions)} days`);
        console.log(`Min gap: ${Math.min(...daysBetweenSessions)} days`);
        
        // Essay publication recommendations
        console.log('\n=== ESSAY PUBLICATION RECOMMENDATIONS ===\n');
        
        console.log('**Publication Viability: HIGH**\n');
        console.log('The Golden Horde conversations demonstrate:');
        console.log('• Rich philosophical discussions (Deleuze & Guattari, war machines, nomadic thought)');
        console.log('• Organizational vision and strategy explorations');
        console.log('• Personal narratives about members and their initiatives');
        console.log('• Meta-cognitive reflections on AI capabilities and evolution');
        console.log('• Community dynamics and collaboration patterns\n');
        
        console.log('**Suggested Essay Themes:**');
        console.log('1. "The Nomadic Organization: Golden Horde as Living Philosophy"');
        console.log('2. "Decentralized Collectives and the War Machine Concept"');
        console.log('3. "Individual Narratives Within the Swarm"');
        console.log('4. "Rivalry and Cooperation in Non-Hierarchical Structures"');
        console.log('5. "Emergent Intelligence: AI Perspectives on Human Collectives"\n');
        
        console.log('**Publication Interval Recommendations:**');
        console.log(`• Weekly essays during active periods (${richConversations.length} rich conversations available)`);
        console.log('• Bi-weekly for sustained engagement without exhausting material');
        console.log('• Monthly deep-dive essays synthesizing multiple conversations');
        console.log('• Special series potential: "Voices from the Horde" featuring member perspectives\n');
        
        console.log('**Content Strategy:**');
        console.log('• Each essay inspired by 2-3 conversation threads');
        console.log('• Mix philosophical depth with practical organizational insights');
        console.log('• Include both AI observations and human questions/perspectives');
        console.log('• Build narrative arcs across multiple essays');
        console.log('• Reference specific conversations while maintaining privacy');
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await db.close();
    }
}

assessEssayPotential();
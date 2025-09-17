#!/usr/bin/env node

import { DatabaseAgent } from '../database/database-agent.js';

async function analyzeGoldenHordeTurns() {
    const db = new DatabaseAgent({ 
        useProductionDatabase: true,
        requireEnvFile: true 
    });
    
    try {
        await db.connect();
        console.log('Connected to production database');
        
        // First check the correct column names
        await db.queryBuilder.verifyTable('client_mgmt', 'clients');
        
        // Find the golden horde client (using correct column names)
        const clientQuery = `
            SELECT id, name, story, created_at, metadata
            FROM client_mgmt.clients 
            WHERE LOWER(name) = 'golden horde'
        `;
        
        const clientResult = await db.connector.query(clientQuery);
        
        if (clientResult.rows.length === 0) {
            console.log('Client "golden horde" not found');
            return;
        }
        
        const client = clientResult.rows[0];
        console.log('\n=== CLIENT INFORMATION ===');
        console.log(`Client ID: ${client.id}`);
        console.log(`Name: ${client.name}`);
        console.log(`Story: ${client.story || 'N/A'}`);
        console.log(`Metadata:`, client.metadata || 'N/A');
        console.log(`Created: ${client.created_at}`);
        
        // First check what schemas and tables exist
        const schemasResult = await db.connector.query(`
            SELECT DISTINCT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_name LIKE '%turn%' 
            ORDER BY table_schema, table_name
        `);
        console.log('\n=== TURN TABLES FOUND ===');
        schemasResult.rows.forEach(row => {
            console.log(`  ${row.table_schema}.${row.table_name}`);
        });
        
        // Verify table structures
        await db.queryBuilder.verifyTable('meetings', 'meetings');
        await db.queryBuilder.verifyTable('meetings', 'turns');
        
        // Get all turns for this client (using correct column names)
        const turnsQuery = `
            SELECT 
                t.id as turn_id,
                t.content,
                t.source_type,
                t.timestamp,
                t.user_id,
                t.avatar_id,
                t.metadata as turn_metadata,
                m.meeting_type,
                m.name as meeting_name,
                m.created_at as meeting_date,
                LENGTH(t.content) as content_length
            FROM meetings.turns t
            JOIN meetings.meetings m ON t.meeting_id = m.id
            WHERE m.client_id = $1
            ORDER BY t.timestamp ASC
        `;
        
        const turnsResult = await db.connector.query(turnsQuery, [client.id]);
        
        console.log(`\n=== TURN STATISTICS ===`);
        console.log(`Total turns: ${turnsResult.rows.length}`);
        
        if (turnsResult.rows.length > 0) {
            const firstTurn = turnsResult.rows[0];
            const lastTurn = turnsResult.rows[turnsResult.rows.length - 1];
            
            console.log(`First turn: ${firstTurn.timestamp}`);
            console.log(`Last turn: ${lastTurn.timestamp}`);
            
            // Get meeting types distribution
            const meetingTypes = {};
            turnsResult.rows.forEach(turn => {
                meetingTypes[turn.meeting_type] = (meetingTypes[turn.meeting_type] || 0) + 1;
            });
            
            console.log(`\nMeeting types:`);
            Object.entries(meetingTypes).forEach(([type, count]) => {
                console.log(`  ${type}: ${count} turns`);
            });
            
            // Calculate content statistics
            const avgContentLength = turnsResult.rows.reduce((sum, t) => sum + t.content_length, 0) / turnsResult.rows.length;
            
            // Group by source type
            const sourceTypes = {};
            turnsResult.rows.forEach(turn => {
                sourceTypes[turn.source_type] = (sourceTypes[turn.source_type] || 0) + 1;
            });
            
            console.log(`\nSource types:`);
            Object.entries(sourceTypes).forEach(([type, count]) => {
                console.log(`  ${type}: ${count} turns`);
            });
            
            console.log(`\nAverage content length: ${Math.round(avgContentLength)} characters`);
            
            // Sample some turns for thematic analysis
            console.log(`\n=== SAMPLE TURNS FOR THEMATIC ANALYSIS ===`);
            
            // Take every Nth turn to get a representative sample
            const sampleInterval = Math.max(1, Math.floor(turnsResult.rows.length / 10));
            const samples = [];
            
            for (let i = 0; i < turnsResult.rows.length; i += sampleInterval) {
                const turn = turnsResult.rows[i];
                samples.push({
                    turn_id: turn.turn_id,
                    timestamp: turn.timestamp,
                    content_preview: turn.content.substring(0, 300) + (turn.content.length > 300 ? '...' : ''),
                    source_type: turn.source_type,
                    meeting_type: turn.meeting_type,
                    meeting_name: turn.meeting_name
                });
            }
            
            samples.forEach((sample, idx) => {
                console.log(`\n--- Sample ${idx + 1} (Turn ${sample.turn_id}) ---`);
                console.log(`Date: ${sample.timestamp}`);
                console.log(`Meeting: ${sample.meeting_name || 'Unnamed'} (${sample.meeting_type})`);
                console.log(`Source: ${sample.source_type}`);
                console.log(`Content: ${sample.content_preview}`);
            });
            
            // Analyze temporal distribution
            console.log(`\n=== TEMPORAL DISTRIBUTION ===`);
            const turnsByMonth = {};
            turnsResult.rows.forEach(turn => {
                const month = turn.timestamp.toISOString().substring(0, 7);
                turnsByMonth[month] = (turnsByMonth[month] || 0) + 1;
            });
            
            Object.entries(turnsByMonth).sort().forEach(([month, count]) => {
                console.log(`${month}: ${count} turns`);
            });
            
            // Identify potential essay themes based on keywords
            console.log(`\n=== POTENTIAL THEMES ===`);
            const themeKeywords = {
                'technical': /code|function|database|api|system|implementation/gi,
                'philosophical': /think|believe|meaning|purpose|understand|consciousness/gi,
                'creative': /imagine|create|design|art|story|narrative/gi,
                'analytical': /analyze|examine|investigate|research|data|pattern/gi,
                'strategic': /plan|strategy|goal|objective|future|vision/gi
            };
            
            const themeCounts = {};
            Object.keys(themeKeywords).forEach(theme => themeCounts[theme] = 0);
            
            turnsResult.rows.forEach(turn => {
                const content = turn.content || '';
                Object.entries(themeKeywords).forEach(([theme, regex]) => {
                    const matches = content.match(regex);
                    if (matches) {
                        themeCounts[theme] += matches.length;
                    }
                });
            });
            
            Object.entries(themeCounts).sort((a, b) => b[1] - a[1]).forEach(([theme, count]) => {
                console.log(`${theme}: ${count} keyword occurrences`);
            });
            
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await db.close();
    }
}

analyzeGoldenHordeTurns();
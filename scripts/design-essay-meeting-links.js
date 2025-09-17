#!/usr/bin/env node

import { DatabaseAgent } from '../database/database-agent.js';

async function designEssayMeetingLinks() {
    const db = new DatabaseAgent({ 
        useProductionDatabase: true,
        requireEnvFile: true 
    });
    
    try {
        await db.connect();
        console.log('Connected to production database\n');
        
        // Get sample meetings for Golden Horde
        const meetingsQuery = `
            SELECT 
                m.id as meeting_id,
                m.name as meeting_name,
                m.created_at,
                m.meeting_url,
                m.published_transcript,
                COUNT(t.id) as turn_count,
                MIN(t.timestamp) as first_turn,
                MAX(t.timestamp) as last_turn
            FROM meetings.meetings m
            LEFT JOIN meetings.turns t ON t.meeting_id = m.id
            WHERE m.client_id = 9  -- Golden Horde
            GROUP BY m.id, m.name, m.created_at, m.meeting_url, m.published_transcript
            ORDER BY m.created_at DESC
        `;
        
        const meetingsResult = await db.connector.query(meetingsQuery);
        
        console.log('=== ESSAY-TO-MEETING LINKING DESIGN ===\n');
        console.log(`Total Golden Horde meetings: ${meetingsResult.rows.length}\n`);
        
        console.log('=== CURRENT MEETING STRUCTURE ===\n');
        meetingsResult.rows.slice(0, 3).forEach(meeting => {
            console.log(`Meeting ID: ${meeting.meeting_id}`);
            console.log(`Name: ${meeting.meeting_name}`);
            console.log(`Created: ${meeting.created_at.toLocaleDateString()}`);
            console.log(`Turns: ${meeting.turn_count}`);
            console.log(`Meeting URL: ${meeting.meeting_url || 'None'}`);
            console.log(`Published: ${meeting.published_transcript ? 'Yes' : 'No'}`);
            console.log('---');
        });
        
        console.log('\n=== PROPOSED ESSAY PUBLICATION SYSTEM ===\n');
        
        console.log('**Database Schema Addition:**\n');
        console.log(`CREATE TABLE essays.publications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,  -- URL-friendly identifier
    content TEXT NOT NULL,       -- The essay content
    excerpt TEXT,                -- Brief summary for listings
    client_id BIGINT REFERENCES client_mgmt.clients(id),
    published_at TIMESTAMP,
    status TEXT DEFAULT 'draft', -- draft, published, archived
    metadata JSONB,              -- Tags, themes, etc.
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE essays.essay_meeting_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    essay_id UUID REFERENCES essays.publications(id) ON DELETE CASCADE,
    meeting_id BIGINT REFERENCES meetings.meetings(id),
    turn_ids UUID[],             -- Specific turns that inspired content
    relevance_note TEXT,         -- How this meeting relates to the essay
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_essay_links_essay ON essays.essay_meeting_links(essay_id);
CREATE INDEX idx_essay_links_meeting ON essays.essay_meeting_links(meeting_id);
`);
        
        console.log('\n**Link Generation Strategy:**\n');
        console.log('1. **Direct References** - Essays explicitly cite specific conversations');
        console.log('   Example: "As discussed in the August 3rd session about rivalry..."');
        console.log('   Link: essay_id → meeting_id with specific turn_ids\n');
        
        console.log('2. **Thematic Inspiration** - Essays inspired by themes across multiple meetings');
        console.log('   Example: Essay on "Nomadic Organizations" draws from 5 different conversations');
        console.log('   Links: essay_id → multiple meeting_ids with relevance_notes\n');
        
        console.log('3. **Participant Perspectives** - Essays featuring specific member viewpoints');
        console.log('   Example: "Ian\'s Vision for Decentralized Collectives"');
        console.log('   Links: essay_id → meetings where Ian\'s ideas were discussed\n');
        
        console.log('**Implementation Features:**\n');
        
        console.log('• **Privacy Controls:**');
        console.log('  - Only link to meetings with published_transcript = true');
        console.log('  - Option to anonymize participant names in essays');
        console.log('  - Configurable visibility levels per essay\n');
        
        console.log('• **Navigation UI:**');
        console.log('  - "View Source Conversations" button on each essay');
        console.log('  - "Inspired By" sidebar showing linked meetings');
        console.log('  - Timeline view showing essay publication alongside conversations\n');
        
        console.log('• **Discovery Features:**');
        console.log('  - "Related Essays" on meeting pages');
        console.log('  - Topic clustering across essays and meetings');
        console.log('  - "Follow the Thread" - trace ideas across conversations and essays\n');
        
        // Check existing meeting URLs and access patterns
        const accessibleMeetings = meetingsResult.rows.filter(m => m.meeting_url || m.published_transcript);
        
        console.log('**Access Analysis:**');
        console.log(`Meetings with URLs: ${meetingsResult.rows.filter(m => m.meeting_url).length}`);
        console.log(`Published transcripts: ${meetingsResult.rows.filter(m => m.published_transcript).length}`);
        console.log(`Accessible for linking: ${accessibleMeetings.length}\n`);
        
        console.log('**API Endpoints Needed:**\n');
        console.log('POST   /api/essays                  - Create new essay');
        console.log('POST   /api/essays/:id/links        - Add meeting links to essay');
        console.log('GET    /api/essays/:slug            - Get essay with linked meetings');
        console.log('GET    /api/meetings/:id/essays     - Get essays inspired by meeting');
        console.log('GET    /api/essays/by-theme/:theme  - Get essays by theme\n');
        
        console.log('**Publishing Workflow:**\n');
        console.log('1. Author writes essay inspired by conversations');
        console.log('2. System suggests relevant meetings based on content analysis');
        console.log('3. Author confirms/adjusts meeting links and adds relevance notes');
        console.log('4. Essay published with bidirectional links to source material');
        console.log('5. Readers can explore both essay and original conversations\n');
        
        console.log('**Benefits:**');
        console.log('• Transparency - readers see the conversational foundation');
        console.log('• Context - essays gain depth from source material');
        console.log('• Discovery - new paths through the knowledge graph');
        console.log('• Attribution - proper credit to conversation participants');
        console.log('• Learning - AI and humans can trace idea evolution');
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await db.close();
    }
}

designEssayMeetingLinks();
#!/usr/bin/env node

import { DatabaseAgent } from '../database/database-agent.js';

async function designLinkedInEssayPosting() {
    const db = new DatabaseAgent({ 
        useProductionDatabase: true,
        requireEnvFile: true 
    });
    
    try {
        await db.connect();
        console.log('=== LINKEDIN ESSAY POSTING SYSTEM DESIGN ===\n');
        
        // Get a sample essay-meeting we created
        const essayQuery = `
            SELECT 
                m.id,
                m.name,
                m.description,
                m.metadata,
                m.created_at,
                t.content as essay_content
            FROM meetings.meetings m
            JOIN meetings.turns t ON t.meeting_id = m.id
            WHERE m.meeting_type = 'essay'
            AND t.source_type = 'essay-seed'
            ORDER BY m.created_at DESC
            LIMIT 1
        `;
        
        const essayResult = await db.connector.query(essayQuery);
        
        if (essayResult.rows.length > 0) {
            const essay = essayResult.rows[0];
            console.log('Found essay-meeting to use as example:');
            console.log(`Title: ${essay.name}\n`);
        }
        
        console.log('**LINKEDIN POSTING STRATEGY:**\n');
        
        console.log('1. **Content Formats:**\n');
        console.log('   a) Full Essay Post (2,000-3,000 chars)');
        console.log('      - Opening hook from essay');
        console.log('      - Key themes and questions');
        console.log('      - Invitation to engage');
        console.log('      - Link to full essay-meeting\n');
        
        console.log('   b) Teaser Blurb (500-800 chars)');
        console.log('      - Provocative question from essay');
        console.log('      - Brief context');
        console.log('      - "Join the conversation" CTA\n');
        
        console.log('   c) Thread Series (3-5 connected posts)');
        console.log('      - Each post explores one theme');
        console.log('      - Links between posts');
        console.log('      - Final post links to essay-meeting\n');
        
        console.log('2. **SAMPLE LINKEDIN BLURBS:**\n');
        
        const blurb1 = `🌊 The Nomadic Organization: How does a collective maintain coherence without hierarchy?

Drawing from conversations within the Golden Horde, we're exploring what Deleuze & Guattari called the "war machine"—not as conflict, but as a mode of organization that resists capture by hierarchical structures.

Key questions emerging:
• What forms of rivalry and cooperation emerge in decentralized spaces?
• How do individual narratives weave into collective intelligence?
• Can organizations be both fluid and coherent?

This isn't just theory—it's how distributed teams, DAOs, and creative collectives are actually operating today.

What patterns do you see in your own non-hierarchical collaborations?

#OrganizationalDesign #FutureOfWork #CollectiveIntelligence #Decentralization`;
        
        console.log('Blurb 1 (Professional/Thoughtful):');
        console.log(blurb1);
        console.log(`\nCharacter count: ${blurb1.length}\n`);
        
        const blurb2 = `What if your organization operated more like a jazz ensemble than an orchestra?

No conductor. No sheet music. Just shared rhythms and emergent harmonies.

The Golden Horde explores this daily—a collective that maintains coherence through shared intention rather than hierarchy. 

Recent conversation sparked this insight: "Rivalry within a non-hierarchical group isn't dysfunction—it's the creative tension that prevents stagnation."

Curious how this actually works? Join our living essay-meeting where these ideas evolve through participation.

#EmergentLeadership #CollectiveCreativity`;
        
        console.log('Blurb 2 (Provocative/Accessible):');
        console.log(blurb2);
        console.log(`\nCharacter count: ${blurb2.length}\n`);
        
        console.log('3. **IMPLEMENTATION ARCHITECTURE:**\n');
        
        console.log('Database Schema Addition:');
        console.log(`
CREATE TABLE social.linkedin_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    essay_meeting_id UUID REFERENCES meetings.meetings(id),
    post_type TEXT, -- 'full', 'teaser', 'thread_part'
    content TEXT NOT NULL,
    char_count INTEGER,
    hashtags TEXT[],
    linkedin_post_id TEXT, -- ID from LinkedIn API after posting
    engagement_metrics JSONB, -- likes, comments, shares from API
    posted_at TIMESTAMP,
    scheduled_for TIMESTAMP,
    status TEXT DEFAULT 'draft', -- draft, scheduled, posted, failed
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_linkedin_essay ON social.linkedin_posts(essay_meeting_id);
CREATE INDEX idx_linkedin_status ON social.linkedin_posts(status);
`);
        
        console.log('\n4. **LINKEDIN API INTEGRATION:**\n');
        
        console.log('Required LinkedIn OAuth Scopes:');
        console.log('• w_member_social - Post content on behalf of user');
        console.log('• r_liteprofile - Read user profile info');
        console.log('• r_member_social - Read engagement metrics\n');
        
        console.log('Environment Variables Needed:');
        console.log('• LINKEDIN_CLIENT_ID');
        console.log('• LINKEDIN_CLIENT_SECRET');
        console.log('• LINKEDIN_ACCESS_TOKEN (user-specific)\n');
        
        console.log('5. **POSTING WORKFLOW:**\n');
        console.log(`
async function postEssayToLinkedIn(essayMeetingId, userId) {
    // 1. Get essay content and metadata
    const essay = await getEssayMeeting(essayMeetingId);
    
    // 2. Generate LinkedIn-optimized blurb
    const blurb = await generateLinkedInBlurb(essay, {
        style: 'professional', // or 'provocative', 'academic'
        maxChars: 1300,
        includeHashtags: true
    });
    
    // 3. Post to LinkedIn API
    const response = await linkedInAPI.post('/shares', {
        author: \`urn:li:person:\${userId}\`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
            'com.linkedin.ugc.ShareContent': {
                shareCommentary: {
                    text: blurb.content
                },
                shareMediaCategory: 'NONE'
            }
        },
        visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
    });
    
    // 4. Store post record
    await db.insert('social.linkedin_posts', {
        essay_meeting_id: essayMeetingId,
        content: blurb.content,
        hashtags: blurb.hashtags,
        linkedin_post_id: response.id,
        posted_at: new Date()
    });
    
    return response;
}
`);
        
        console.log('\n6. **CONTENT GENERATION STRATEGY:**\n');
        
        console.log('Essay → LinkedIn Transformation:');
        console.log('• Extract most provocative question');
        console.log('• Summarize key tension/paradox');
        console.log('• Add real-world application');
        console.log('• Include participation invitation');
        console.log('• Optimize hashtags for discovery\n');
        
        console.log('7. **SCHEDULING & AUTOMATION:**\n');
        
        console.log('Publishing Cadence:');
        console.log('• New essay-meeting created → Draft LinkedIn post');
        console.log('• Review/edit period (optional human touch)');
        console.log('• Auto-post at optimal time (Tue-Thu, 9-10am)');
        console.log('• Follow-up engagement post 2 days later\n');
        
        console.log('8. **ENGAGEMENT LOOP:**\n');
        
        console.log('LinkedIn → Essay-Meeting → LinkedIn:');
        console.log('1. LinkedIn post drives traffic to essay-meeting');
        console.log('2. Essay-meeting generates new insights');
        console.log('3. Rich discussions become new LinkedIn content');
        console.log('4. LinkedIn comments can be imported as turns');
        console.log('5. Creates virtuous cycle of engagement\n');
        
        console.log('9. **PRIVACY & ATTRIBUTION:**\n');
        console.log('• Anonymous participant insights by default');
        console.log('• Opt-in attribution for quoted material');
        console.log('• Aggregate themes rather than individual quotes');
        console.log('• Link to public essay-meetings only');
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await db.close();
    }
}

designLinkedInEssayPosting();
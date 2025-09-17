#!/usr/bin/env node

import { DatabaseAgent } from '../database/database-agent.js';

async function generateLinkedInBlurbs() {
    const db = new DatabaseAgent({ 
        useProductionDatabase: true,
        requireEnvFile: true 
    });
    
    try {
        await db.connect();
        console.log('=== LINKEDIN BLURBS FOR GOLDEN HORDE ESSAYS ===\n');
        
        // Get recent Golden Horde conversations for thematic analysis
        const themesQuery = `
            SELECT 
                t.content,
                t.timestamp,
                m.name as meeting_name
            FROM meetings.turns t
            JOIN meetings.meetings m ON t.meeting_id = m.id
            WHERE m.client_id = 9
            AND t.source_type IN ('conversational-repl-user', 'conversational-repl-llm')
            AND LENGTH(t.content) > 500
            ORDER BY t.timestamp DESC
            LIMIT 10
        `;
        
        const themesResult = await db.connector.query(themesQuery);
        
        // Analyze themes
        const themes = {
            'deleuze_guattari': 0,
            'hierarchy': 0,
            'collective': 0,
            'ian_vision': 0,
            'rivalry': 0,
            'emergence': 0
        };
        
        themesResult.rows.forEach(turn => {
            const content = turn.content.toLowerCase();
            if (content.includes('deleuze') || content.includes('guattari')) themes.deleuze_guattari++;
            if (content.includes('hierarchy') || content.includes('hierarchical')) themes.hierarchy++;
            if (content.includes('collective') || content.includes('horde')) themes.collective++;
            if (content.includes('ian')) themes.ian_vision++;
            if (content.includes('rivalry') || content.includes('cooperation')) themes.rivalry++;
            if (content.includes('emerge') || content.includes('emergent')) themes.emergence++;
        });
        
        console.log('Themes detected in recent conversations:');
        Object.entries(themes).forEach(([theme, count]) => {
            if (count > 0) console.log(`  • ${theme}: ${count} mentions`);
        });
        console.log();
        
        // Generate multiple LinkedIn blurb styles
        const blurbs = [];
        
        // Blurb 1: Philosophy-focused
        if (themes.deleuze_guattari > 0) {
            blurbs.push({
                style: 'Philosophical',
                content: `"The rhizome has no beginning or end; it is always in the middle, between things." - Deleuze & Guattari

The Golden Horde embodies this principle daily. No fixed hierarchy. No central command. Yet it moves with purpose.

We're not building another org chart. We're cultivating a living system where:
→ Leadership emerges from expertise, not position
→ Conflict generates innovation, not dysfunction  
→ Individual paths strengthen collective intelligence

In our latest essay-meeting, we explore how nomadic principles transform modern collaboration.

How does your organization balance structure with fluidity?

#PhilosophyOfWork #DeleuzeAndGuattari #OrganizationalInnovation #CollectiveIntelligence`,
                hashtags: ['#PhilosophyOfWork', '#DeleuzeAndGuattari', '#OrganizationalInnovation', '#CollectiveIntelligence']
            });
        }
        
        // Blurb 2: Practical/Business-focused
        blurbs.push({
            style: 'Business Practical',
            content: `Your next competitive advantage isn't a better org chart—it's abandoning the org chart entirely.

The Golden Horde operates without:
❌ Management layers
❌ Approval chains  
❌ Fixed roles
❌ Central planning

Yet achieves:
✅ Rapid adaptation
✅ Emergent innovation
✅ Deep engagement
✅ Collective intelligence

This isn't chaos. It's sophisticated coordination through shared intention rather than command structures.

Join our living essay where practitioners share real patterns from non-hierarchical collaboration.

What would your team accomplish without permission gates?

#FutureOfWork #SelfOrganization #TeamDynamics #InnovationStrategy`,
            hashtags: ['#FutureOfWork', '#SelfOrganization', '#TeamDynamics', '#InnovationStrategy']
        });
        
        // Blurb 3: Story/Narrative-driven
        if (themes.ian_vision > 0 || themes.collective > 0) {
            blurbs.push({
                style: 'Narrative',
                content: `Picture 12 people scattered across continents, time zones, and disciplines.

No meetings. No status reports. No hierarchy.

Yet they're building something unprecedented—not despite the distance, but because of it.

The Golden Horde discovered that true collaboration doesn't require proximity or permission. It requires:
• Shared vision without shared location
• Trust without oversight
• Progress without process

Each member brings their own "war machine" to the collective, maintaining autonomy while amplifying group intelligence.

Explore how in our interactive essay-meeting.

#DistributedTeams #RemoteCollaboration #TeamCulture #OrganizationalStories`,
                hashtags: ['#DistributedTeams', '#RemoteCollaboration', '#TeamCulture', '#OrganizationalStories']
            });
        }
        
        // Blurb 4: Question-driven/Provocative
        blurbs.push({
            style: 'Provocative Questions',
            content: `Three questions that might transform how you think about organization:

1. What if rivalry within your team was a feature, not a bug?

2. What if the best decisions emerged without anyone making them?

3. What if your organization's strength came from refusing to be organized?

The Golden Horde lives these questions daily. Not as thought experiments, but as operating principles.

Join our essay-meeting to explore what happens when paradox becomes practice.

#OrganizationalParadox #EmergentStrategy #CollectiveWisdom`,
            hashtags: ['#OrganizationalParadox', '#EmergentStrategy', '#CollectiveWisdom']
        });
        
        // Blurb 5: Academic/Research-oriented
        blurbs.push({
            style: 'Academic/Research',
            content: `New organizational forms are emerging at the intersection of complexity science and social philosophy.

The Golden Horde represents a live experiment in:
• Stigmergic coordination (indirect communication through environmental modification)
• Heterarchical governance (situation-dependent leadership)
• Rhizomatic growth (non-hierarchical expansion)

Our essay-meetings document these patterns as they emerge, creating a participatory research space where theory meets practice.

Contributing your observations to our collective intelligence.

#ComplexityScienc #OrganizationalResearch #EmergentSystems #CollectiveIntelligence`,
            hashtags: ['#ComplexityScience', '#OrganizationalResearch', '#EmergentSystems', '#CollectiveIntelligence']
        });
        
        // Display all generated blurbs
        console.log('=== GENERATED LINKEDIN BLURBS ===\n');
        blurbs.forEach((blurb, index) => {
            console.log(`--- BLURB ${index + 1}: ${blurb.style} ---`);
            console.log(blurb.content);
            console.log(`\nCharacter count: ${blurb.content.length}`);
            console.log(`Hashtags: ${blurb.hashtags.join(' ')}`);
            console.log('\n' + '='.repeat(60) + '\n');
        });
        
        // Generate posting schedule
        console.log('=== SUGGESTED POSTING SCHEDULE ===\n');
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const times = ['9:00 AM', '11:30 AM', '2:00 PM'];
        
        blurbs.forEach((blurb, index) => {
            const dayIndex = index % days.length;
            const timeIndex = index % times.length;
            console.log(`Week ${Math.floor(index / 5) + 1}, ${days[dayIndex]} at ${times[timeIndex]}: ${blurb.style} blurb`);
        });
        
        console.log('\n=== ENGAGEMENT STRATEGY ===\n');
        console.log('After posting:');
        console.log('1. Monitor comments for 2-4 hours');
        console.log('2. Respond to questions with essay-meeting insights');
        console.log('3. Invite commenters to join the essay-meeting');
        console.log('4. Import valuable LinkedIn discussions as turns');
        console.log('5. Create follow-up post highlighting best comments\n');
        
        console.log('=== METRICS TO TRACK ===\n');
        console.log('• Impressions and reach');
        console.log('• Click-through to essay-meetings');
        console.log('• New participants in essay-meetings from LinkedIn');
        console.log('• Quality of discussions sparked');
        console.log('• Cross-pollination between platforms');
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await db.close();
    }
}

generateLinkedInBlurbs();
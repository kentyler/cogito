import { DatabaseManager } from './lib/database.js';
import fs from 'fs/promises';
import path from 'path';

const db = new DatabaseManager();

async function analyzeConversations() {
    try {
        console.log('🔍 Analyzing conversation history...\n');

        // Query all blocks with their turns
        const blocksQuery = `
            SELECT 
                b.block_id,
                b.name,
                b.description,
                b.block_type,
                b.created_at,
                b.metadata,
                COUNT(bt.turn_id) as turn_count
            FROM conversation.blocks b
            LEFT JOIN conversation.block_turns bt ON b.block_id = bt.block_id
            GROUP BY b.block_id
            ORDER BY b.created_at DESC
        `;
        
        const blocks = await db.pool.query(blocksQuery);
        console.log(`📊 Found ${blocks.rows.length} conversation blocks\n`);

        // Get detailed turns for each block
        const allConversations = [];
        
        for (const block of blocks.rows) {
            const turnsQuery = `
                SELECT 
                    t.turn_id,
                    t.participant_id,
                    p.name as participant_name,
                    p.type as participant_type,
                    t.content,
                    t.timestamp,
                    t.source_type,
                    t.metadata,
                    bt.sequence_order
                FROM conversation.turns t
                JOIN conversation.block_turns bt ON t.turn_id = bt.turn_id
                LEFT JOIN conversation.participants p ON t.participant_id = p.id
                WHERE bt.block_id = $1
                ORDER BY bt.sequence_order
            `;
            
            const turns = await db.pool.query(turnsQuery, [block.block_id]);
            
            allConversations.push({
                block: block,
                turns: turns.rows
            });
        }

        // Analyze for inflection points
        console.log('🎯 Identifying inflection points...\n');
        
        const inflectionPoints = {
            decisions: [],
            discoveries: [],
            pivots: [],
            challenges: []
        };

        // Pattern recognition for inflection points
        const decisionPatterns = [
            /let's\s+(go with|proceed|implement|use|choose)/i,
            /I\s+(decide|choose|prefer|think we should)/i,
            /we\s+(should|will|need to|have to)\s+\w+/i,
            /the\s+(best|better|optimal)\s+(approach|solution|way)/i,
            /instead of/i,
            /rather than/i
        ];

        const discoveryPatterns = [
            /I\s+(realize|understand|see|notice|found|discovered)/i,
            /interesting|fascinating|insightful/i,
            /aha|eureka|breakthrough/i,
            /now\s+I\s+(get|understand|see)/i,
            /that\s+(explains|clarifies|makes sense)/i,
            /pattern|connection|relationship/i
        ];

        const pivotPatterns = [
            /actually|wait|hold on/i,
            /on second thought/i,
            /let me\s+(reconsider|rethink|revise)/i,
            /different\s+(approach|angle|perspective)/i,
            /what if\s+we/i,
            /alternatively/i
        ];

        const challengePatterns = [
            /but\s+(what|how|why)/i,
            /doesn't\s+that\s+(mean|imply|suggest)/i,
            /I'm\s+(not sure|confused|unclear)/i,
            /could you\s+(explain|clarify)/i,
            /contradiction|conflict|tension/i,
            /problem with that/i
        ];

        // Analyze each conversation
        for (const conv of allConversations) {
            for (let i = 0; i < conv.turns.length; i++) {
                const turn = conv.turns[i];
                const content = turn.content || '';
                const context = {
                    block_name: conv.block.name,
                    participant: turn.participant_name || 'Unknown',
                    timestamp: turn.timestamp,
                    turn_id: turn.turn_id,
                    sequence: turn.sequence_order
                };

                // Check for decision points
                for (const pattern of decisionPatterns) {
                    if (pattern.test(content)) {
                        const match = content.match(pattern);
                        inflectionPoints.decisions.push({
                            ...context,
                            type: 'decision',
                            excerpt: content.substring(
                                Math.max(0, match.index - 50),
                                Math.min(content.length, match.index + match[0].length + 100)
                            ).trim(),
                            pattern_matched: pattern.toString()
                        });
                        break;
                    }
                }

                // Check for discoveries
                for (const pattern of discoveryPatterns) {
                    if (pattern.test(content)) {
                        const match = content.match(pattern);
                        inflectionPoints.discoveries.push({
                            ...context,
                            type: 'discovery',
                            excerpt: content.substring(
                                Math.max(0, match.index - 50),
                                Math.min(content.length, match.index + match[0].length + 100)
                            ).trim(),
                            pattern_matched: pattern.toString()
                        });
                        break;
                    }
                }

                // Check for pivots
                for (const pattern of pivotPatterns) {
                    if (pattern.test(content)) {
                        const match = content.match(pattern);
                        inflectionPoints.pivots.push({
                            ...context,
                            type: 'pivot',
                            excerpt: content.substring(
                                Math.max(0, match.index - 50),
                                Math.min(content.length, match.index + match[0].length + 100)
                            ).trim(),
                            pattern_matched: pattern.toString()
                        });
                        break;
                    }
                }

                // Check for challenges
                for (const pattern of challengePatterns) {
                    if (pattern.test(content)) {
                        const match = content.match(pattern);
                        inflectionPoints.challenges.push({
                            ...context,
                            type: 'challenge',
                            excerpt: content.substring(
                                Math.max(0, match.index - 50),
                                Math.min(content.length, match.index + match[0].length + 100)
                            ).trim(),
                            pattern_matched: pattern.toString()
                        });
                        break;
                    }
                }
            }
        }

        // Generate analysis report
        const report = {
            summary: {
                total_blocks: blocks.rows.length,
                total_turns: allConversations.reduce((sum, conv) => sum + conv.turns.length, 0),
                date_range: {
                    earliest: blocks.rows[blocks.rows.length - 1]?.created_at,
                    latest: blocks.rows[0]?.created_at
                },
                inflection_points: {
                    decisions: inflectionPoints.decisions.length,
                    discoveries: inflectionPoints.discoveries.length,
                    pivots: inflectionPoints.pivots.length,
                    challenges: inflectionPoints.challenges.length
                }
            },
            inflection_points: inflectionPoints,
            block_details: allConversations.map(conv => ({
                block_id: conv.block.block_id,
                name: conv.block.name,
                type: conv.block.block_type,
                created: conv.block.created_at,
                turn_count: conv.turns.length,
                participants: [...new Set(conv.turns.map(t => t.participant_name))].filter(Boolean)
            }))
        };

        // Save report
        const reportPath = path.join(process.cwd(), 'conversation-analysis-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        console.log(`📄 Analysis report saved to: ${reportPath}\n`);

        // Print summary
        console.log('📊 ANALYSIS SUMMARY:');
        console.log('==================');
        console.log(`Total Conversation Blocks: ${report.summary.total_blocks}`);
        console.log(`Total Turns: ${report.summary.total_turns}`);
        console.log(`\nInflection Points Found:`);
        console.log(`  - Decisions: ${report.summary.inflection_points.decisions}`);
        console.log(`  - Discoveries: ${report.summary.inflection_points.discoveries}`);
        console.log(`  - Pivots: ${report.summary.inflection_points.pivots}`);
        console.log(`  - Challenges: ${report.summary.inflection_points.challenges}`);

        // Show sample inflection points
        console.log('\n🔍 SAMPLE INFLECTION POINTS:');
        console.log('============================\n');

        if (inflectionPoints.decisions.length > 0) {
            console.log('DECISIONS:');
            inflectionPoints.decisions.slice(0, 3).forEach(point => {
                console.log(`- [${point.participant}] "${point.excerpt}"`);
                console.log(`  (${point.block_name}, ${new Date(point.timestamp).toLocaleString()})\n`);
            });
        }

        if (inflectionPoints.discoveries.length > 0) {
            console.log('\nDISCOVERIES:');
            inflectionPoints.discoveries.slice(0, 3).forEach(point => {
                console.log(`- [${point.participant}] "${point.excerpt}"`);
                console.log(`  (${point.block_name}, ${new Date(point.timestamp).toLocaleString()})\n`);
            });
        }

        await db.close();

    } catch (error) {
        console.error('Error analyzing conversations:', error);
        await db.close();
        process.exit(1);
    }
}

// Run the analysis
analyzeConversations();
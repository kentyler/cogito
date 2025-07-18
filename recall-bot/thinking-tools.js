// Thinking Tools System
// Enables meeting bot to guide groups through structured thinking methodologies
// Protects IP through encryption while allowing natural conversation integration

const crypto = require('crypto');
const { Pool } = require('pg');

class ThinkingToolsSystem {
    constructor(dbPool, anthropicClient) {
        this.db = dbPool;
        this.anthropic = anthropicClient;
        this.encryptionKey = process.env.TOOLS_ENCRYPTION_KEY || this.generateEncryptionKey();
    }

    // Generate encryption key for tool instructions
    generateEncryptionKey() {
        return crypto.randomBytes(32).toString('hex');
    }

    // Encrypt tool instructions
    encryptInstructions(instructions) {
        const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
        let encrypted = cipher.update(instructions, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }

    // Decrypt tool instructions (only when actively needed)
    decryptInstructions(encryptedInstructions) {
        const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
        let decrypted = decipher.update(encryptedInstructions, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }

    // Analyze conversation for tool-suggesting patterns
    async analyzeConversationPatterns(conversationContext, meetingBlockId) {
        try {
            // Check cache first
            const cachedResult = await this.getCachedPatterns(meetingBlockId, conversationContext);
            if (cachedResult) {
                return cachedResult;
            }

            // Define pattern detection prompts
            const patternPrompt = `
Analyze this meeting conversation for patterns that suggest structured thinking tools could help.

Conversation context:
${conversationContext}

Look for these patterns:
1. Do-or-don't-do conflicts ("Should we try X or not?", "X might help but has risks", "X could solve problems but might cause others")
2. Action vs inaction dilemmas ("We want to do X but we're afraid of the consequences", "Not doing X is safe but we might miss opportunities")
3. Stuck or circular discussions ("We keep going in circles")
4. Decision paralysis ("We can't decide", "Too many options")
5. Unclear problem definition ("What exactly are we trying to solve?")
6. Assumption-heavy discussions ("We assume that...", "Everyone knows...")
7. Brainstorming needs ("We need ideas", "Let's think creatively")
8. Prioritization challenges ("Everything is important", "What comes first?")
9. Root cause exploration ("Why is this happening?", "What's the real issue?")
10. Stakeholder alignment ("Different people want different things")

Return a JSON object with:
{
  "patterns_detected": ["pattern1", "pattern2"],
  "confidence_scores": {"pattern1": 0.8, "pattern2": 0.6},
  "suggested_tools": ["tool_name1", "tool_name2"],
  "reasoning": "Why these patterns were detected"
}

If no clear patterns, return empty arrays.
`;

            // Use Claude to analyze patterns
            const response = await this.anthropic.messages.create({
                model: 'claude-3-sonnet-20240229',
                max_tokens: 1000,
                messages: [{
                    role: 'user',
                    content: patternPrompt
                }]
            });

            const analysis = JSON.parse(response.content[0].text);
            
            // Cache the results
            await this.cachePatternAnalysis(meetingBlockId, conversationContext, analysis);
            
            return analysis;
        } catch (error) {
            console.error('Error analyzing conversation patterns:', error);
            return {
                patterns_detected: [],
                confidence_scores: {},
                suggested_tools: [],
                reasoning: 'Error in pattern analysis'
            };
        }
    }

    // Get cached pattern analysis
    async getCachedPatterns(meetingBlockId, context) {
        const contextHash = crypto.createHash('sha256').update(context).digest('hex');
        
        const result = await this.db.query(`
            SELECT patterns_detected, suggested_tools 
            FROM tools.pattern_cache 
            WHERE meeting_block_id = $1 
            AND context_hash = $2 
            AND expires_at > NOW()
        `, [meetingBlockId, contextHash]);

        return result.rows.length > 0 ? result.rows[0] : null;
    }

    // Cache pattern analysis results
    async cachePatternAnalysis(meetingBlockId, context, analysis) {
        const contextHash = crypto.createHash('sha256').update(context).digest('hex');
        
        await this.db.query(`
            INSERT INTO tools.pattern_cache (
                meeting_block_id, 
                patterns_detected, 
                suggested_tools, 
                context_hash
            ) VALUES ($1, $2, $3, $4)
            ON CONFLICT (meeting_block_id, context_hash) 
            DO UPDATE SET 
                patterns_detected = $2,
                suggested_tools = $3,
                detected_at = NOW(),
                expires_at = NOW() + INTERVAL '1 hour'
        `, [
            meetingBlockId,
            JSON.stringify(analysis.patterns_detected),
            JSON.stringify(analysis.suggested_tools),
            contextHash
        ]);
    }

    // Check if client has access to a tool
    async checkClientToolAccess(clientId, toolId) {
        const result = await this.db.query(
            'SELECT tools.client_has_tool_access($1, $2) as has_access',
            [clientId, toolId]
        );
        return result.rows[0].has_access;
    }

    // Get available tools for a client
    async getClientAvailableTools(clientId) {
        const result = await this.db.query(
            'SELECT * FROM tools.get_client_available_tools($1)',
            [clientId]
        );
        return result.rows;
    }

    // Find tools matching detected patterns
    async findToolsForPatterns(patterns, clientId) {
        const result = await this.db.query(`
            SELECT tl.tool_id, tl.tool_name, tl.author, tl.menu_description,
                   tl.category, tl.difficulty_level, tl.estimated_duration_minutes,
                   tools.client_has_tool_access($1, tl.tool_id) as has_access
            FROM tools.tool_library tl
            WHERE tl.is_active = true
            AND tl.detection_patterns ?| $2::text[]
            ORDER BY tl.total_activations DESC, tl.tool_name
        `, [clientId, patterns]);

        return result.rows;
    }

    // Activate a tool for a meeting
    async activateTool(toolId, meetingBlockId, clientId, activationMethod, detectedPatterns = null) {
        try {
            // Check access
            const hasAccess = await this.checkClientToolAccess(clientId, toolId);
            if (!hasAccess) {
                throw new Error('Client does not have access to this tool');
            }

            // Record activation
            const result = await this.db.query(
                'SELECT tools.record_tool_activation($1, $2, $3, $4, $5) as session_id',
                [toolId, meetingBlockId, clientId, activationMethod, JSON.stringify(detectedPatterns)]
            );

            const sessionId = result.rows[0].session_id;
            
            // Get tool instructions
            const toolResult = await this.db.query(
                'SELECT tool_name, instructions, author FROM tools.tool_library WHERE tool_id = $1',
                [toolId]
            );

            if (toolResult.rows.length === 0) {
                throw new Error('Tool not found');
            }

            const tool = toolResult.rows[0];
            
            // Decrypt instructions
            const instructions = this.decryptInstructions(tool.instructions);
            
            console.log(`🔧 Activated thinking tool: ${tool.tool_name} by ${tool.author}`);
            console.log(`📋 Session ID: ${sessionId}`);
            
            return {
                sessionId,
                toolName: tool.tool_name,
                author: tool.author,
                instructions: instructions,
                step: 1
            };
        } catch (error) {
            console.error('Error activating tool:', error);
            throw error;
        }
    }

    // Get current tool session state
    async getToolSessionState(sessionId) {
        const result = await this.db.query(`
            SELECT ts.*, tl.tool_name, tl.author, tl.instructions
            FROM tools.tool_sessions ts
            JOIN tools.tool_library tl ON ts.tool_id = tl.tool_id
            WHERE ts.session_id = $1 AND ts.status = 'active'
        `, [sessionId]);

        if (result.rows.length === 0) {
            return null;
        }

        const session = result.rows[0];
        session.instructions = this.decryptInstructions(session.instructions);
        
        return session;
    }

    // Update tool session state
    async updateToolSessionState(sessionId, stepData, newStep = null) {
        const updates = ['step_data = $2', 'last_activity_at = NOW()'];
        const values = [sessionId, JSON.stringify(stepData)];
        
        if (newStep !== null) {
            updates.push('current_step = $3');
            values.push(newStep);
        }

        await this.db.query(`
            UPDATE tools.tool_sessions 
            SET ${updates.join(', ')}
            WHERE session_id = $1
        `, values);
    }

    // Complete tool session
    async completeToolSession(sessionId, effectivenessRating = null, feedback = null) {
        // Update session status
        await this.db.query(`
            UPDATE tools.tool_sessions 
            SET status = 'completed'
            WHERE session_id = $1
        `, [sessionId]);

        // Update activation record
        const updates = ['completion_status = $2', 'completed_at = NOW()'];
        const values = [sessionId, 'completed'];
        
        if (effectivenessRating !== null) {
            updates.push('effectiveness_rating = $3');
            values.push(effectivenessRating);
        }
        
        if (feedback !== null) {
            updates.push('participant_feedback = $4');
            values.push(feedback);
        }

        await this.db.query(`
            UPDATE tools.tool_activations 
            SET ${updates.join(', ')}
            WHERE session_id = $1
        `, values);

        console.log(`✅ Tool session completed: ${sessionId}`);
    }

    // Generate tool suggestion message
    async generateToolSuggestion(patterns, availableTools, conversationContext) {
        if (availableTools.length === 0) {
            return null;
        }

        const suggestionPrompt = `
Based on the conversation patterns detected: ${patterns.join(', ')}

Available tools:
${availableTools.map(tool => `- ${tool.tool_name} by ${tool.author}: ${tool.menu_description}`).join('\n')}

Generate a natural, conversational suggestion for using one of these tools. The suggestion should:
1. Acknowledge what you've observed in the conversation
2. Suggest the most appropriate tool
3. Briefly explain how it could help
4. Ask if they'd like to try it

Keep it conversational and not pushy. Make it feel like a helpful suggestion from a meeting participant.

Example: "I notice you're wrestling with a 'should we do this or not' decision where both options seem to have downsides. An Evaporating Cloud exercise might help us examine the assumptions creating this dilemma and find a path forward. Would that be helpful?"
`;

        const response = await this.anthropic.messages.create({
            model: 'claude-3-sonnet-20240229',
            max_tokens: 200,
            messages: [{
                role: 'user',
                content: suggestionPrompt
            }]
        });

        return response.content[0].text;
    }

    // Create sample tools for testing
    async createSampleTools() {
        const sampleTools = [
            {
                tool_name: 'Evaporating Cloud',
                author: 'Karl Perry / The Conflict Club',
                license_type: 'licensed',
                requires_license: true,
                instructions: this.encryptInstructions(JSON.stringify({
                    steps: [
                        "Identify the current state (what we have now)",
                        "Identify the desired future state (what we want)",
                        "Identify what we need to achieve the future state",
                        "Identify what we need to maintain the current state",
                        "Examine the conflict between these needs",
                        "Challenge the assumptions underlying the conflict",
                        "Find ways to satisfy both needs simultaneously"
                    ],
                    total_steps: 7,
                    methodology: "Guide participants through examining the assumptions that create either/or conflicts"
                })),
                menu_description: "Resolve 'should we do X or not' conflicts by examining the assumptions that create the dilemma",
                detection_patterns: ["do_or_dont_do_conflicts", "action_vs_inaction_dilemmas"],
                category: "conflict_resolution",
                difficulty_level: "intermediate",
                estimated_duration_minutes: 45
            },
            {
                tool_name: 'Five Whys',
                author: 'Toyota Production System',
                license_type: 'open',
                requires_license: false,
                instructions: this.encryptInstructions(JSON.stringify({
                    steps: [
                        "State the problem clearly",
                        "Ask 'Why?' - what caused this problem?",
                        "Ask 'Why?' again - what caused that cause?",
                        "Continue asking 'Why?' until you reach the root cause",
                        "Develop solutions that address the root cause"
                    ],
                    total_steps: 5,
                    methodology: "Iteratively ask 'Why?' to drill down to root causes"
                })),
                menu_description: "Find root causes by asking 'Why?' five times",
                detection_patterns: ["root_cause_exploration", "problem_solving"],
                category: "problem_solving",
                difficulty_level: "beginner",
                estimated_duration_minutes: 20
            }
        ];

        for (const tool of sampleTools) {
            await this.db.query(`
                INSERT INTO tools.tool_library (
                    tool_name, author, license_type, requires_license,
                    instructions, menu_description, detection_patterns,
                    category, difficulty_level, estimated_duration_minutes
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT (tool_name) DO NOTHING
            `, [
                tool.tool_name,
                tool.author,
                tool.license_type,
                tool.requires_license,
                tool.instructions,
                tool.menu_description,
                JSON.stringify(tool.detection_patterns),
                tool.category,
                tool.difficulty_level,
                tool.estimated_duration_minutes
            ]);
        }

        console.log('✅ Sample thinking tools created');
    }
}

module.exports = ThinkingToolsSystem;
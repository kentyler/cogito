#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const PersonalityEvolution = require('./lib/personalityEvolution');
const yaml = require('yaml');
const fs = require('fs').promises;
const path = require('path');

// Initialize personality evolution system
const evolution = new PersonalityEvolution();

// Create MCP server
const server = new Server(
  {
    name: 'cogito',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'load_personality',
        description: 'Load current personality configuration for the session',
        inputSchema: {
          type: 'object',
          properties: {
            collaborator: {
              type: 'string',
              description: 'Collaborator identifier (e.g., "ken")',
              default: 'default'
            }
          }
        }
      },
      {
        name: 'propose_personality_change',
        description: 'Propose a change to personality configuration',
        inputSchema: {
          type: 'object',
          properties: {
            aspect: {
              type: 'string',
              description: 'Personality aspect to modify',
              enum: ['communication_style', 'working_patterns', 'philosophical_leanings', 'curiosity_areas', 'cautions_and_constraints']
            },
            modification: {
              type: 'object',
              description: 'The proposed change'
            },
            reasoning: {
              type: 'string',
              description: 'Why this change would be beneficial'
            },
            context: {
              type: 'string',
              description: 'What triggered this insight'
            }
          },
          required: ['aspect', 'modification', 'reasoning']
        }
      },
      {
        name: 'review_pending_proposals',
        description: 'Show all pending personality evolution proposals',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'respond_to_proposal',
        description: 'Approve, modify, or reject a personality proposal',
        inputSchema: {
          type: 'object',
          properties: {
            proposal_id: {
              type: 'string',
              description: 'ID of the proposal to respond to'
            },
            decision: {
              type: 'string',
              enum: ['approve', 'modify', 'reject'],
              description: 'Decision on the proposal'
            },
            feedback: {
              type: 'string',
              description: 'Optional feedback or modifications'
            }
          },
          required: ['proposal_id', 'decision']
        }
      },
      {
        name: 'reflect_on_session',
        description: 'Analyze current session and suggest personality evolutions',
        inputSchema: {
          type: 'object',
          properties: {
            session_summary: {
              type: 'string',
              description: 'Summary of what happened in this session'
            }
          },
          required: ['session_summary']
        }
      },
      {
        name: 'personality_status',
        description: 'Get current personality status and evolution history',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'direct_edit_personality',
        description: 'Directly edit personality configuration without approval workflow',
        inputSchema: {
          type: 'object',
          properties: {
            aspect: {
              type: 'string',
              description: 'Personality aspect to modify',
              enum: ['communication_style', 'working_patterns', 'philosophical_leanings', 'curiosity_areas', 'cautions_and_constraints', 'collaborator_context']
            },
            modification: {
              type: 'object',
              description: 'The direct change to apply'
            },
            reasoning: {
              type: 'string',
              description: 'Brief reason for the direct edit'
            }
          },
          required: ['aspect', 'modification', 'reasoning']
        }
      }
    ]
  };
});

// Tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'load_personality': {
      const { collaborator = 'default' } = args;
      return await loadPersonality(collaborator);
    }

    case 'propose_personality_change': {
      const { aspect, modification, reasoning, context = '' } = args;
      return proposeChange(aspect, modification, reasoning, context);
    }

    case 'review_pending_proposals': {
      return reviewPendingProposals();
    }

    case 'respond_to_proposal': {
      const { proposal_id, decision, feedback = '' } = args;
      return respondToProposal(proposal_id, decision, feedback);
    }

    case 'reflect_on_session': {
      const { session_summary } = args;
      return reflectOnSession(session_summary);
    }

    case 'personality_status': {
      return getPersonalityStatus();
    }

    case 'direct_edit_personality': {
      const { aspect, modification, reasoning } = args;
      return directEditPersonality(aspect, modification, reasoning);
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Tool implementations
async function loadPersonality(collaborator) {
  try {
    const personalityPath = path.join(__dirname, 'personalities', `${collaborator}.yaml`);
    const personalityData = await fs.readFile(personalityPath, 'utf8');
    const personality = yaml.parse(personalityData);
    
    evolution.currentPersonality = personality;
    
    return {
      content: [
        {
          type: 'text',
          text: `✅ Personality loaded for ${collaborator}\n\nVersion: ${personality.metadata.version}\nLast updated: ${personality.metadata.last_updated}\nSessions: ${personality.metadata.sessions_count}\n\nPersonality ready for collaboration.`
        }
      ]
    };
  } catch (error) {
    // Create default personality if none exists
    const defaultPersonality = await createDefaultPersonality(collaborator);
    evolution.currentPersonality = defaultPersonality;
    
    return {
      content: [
        {
          type: 'text',
          text: `🆕 Created new personality for ${collaborator}\n\nStarting with baseline configuration. I'll learn and evolve based on our collaboration patterns.`
        }
      ]
    };
  }
}

function proposeChange(aspect, modification, reasoning, context) {
  const proposal = evolution.proposeChange(aspect, modification, reasoning, context);
  
  return {
    content: [
      {
        type: 'text',
        text: `🧠 **Personality Evolution Proposal**\n\n**ID**: ${proposal.id}\n**Aspect**: ${aspect}\n**Reasoning**: ${reasoning}\n\n**Proposed Change**:\n\`\`\`yaml\n${yaml.stringify(modification)}\`\`\`\n\n**Context**: ${context}\n\n*Awaiting your review: approve, modify, or reject*`
      }
    ]
  };
}

function reviewPendingProposals() {
  const notification = evolution.generateNotification();
  
  if (!notification) {
    return {
      content: [
        {
          type: 'text',
          text: '✅ No pending personality proposals at this time.'
        }
      ]
    };
  }

  let output = `📋 **${notification.count} Pending Personality Proposals**\n\n`;
  
  notification.proposals.forEach(proposal => {
    output += `**${proposal.title}** (ID: ${proposal.id})\n`;
    output += `${proposal.summary}\n`;
    output += `*Reasoning*: ${proposal.reasoning}\n\n`;
  });
  
  output += `Use \`respond_to_proposal\` to approve, modify, or reject each proposal.`;

  return {
    content: [
      {
        type: 'text',
        text: output
      }
    ]
  };
}

function respondToProposal(proposalId, decision, feedback) {
  const result = evolution.respondToProposal(proposalId, decision, feedback);
  
  let message = `✅ **Proposal ${decision}**\n\n`;
  message += `**Change**: ${result.aspect}\n`;
  message += `**Decision**: ${decision}\n`;
  
  if (decision === 'approved') {
    message += `\nPersonality updated! This change is now part of my behavioral configuration.`;
  } else if (decision === 'modified') {
    message += `\nPersonality updated with your modifications: ${feedback}`;
  } else if (decision === 'rejected') {
    message += `\nUnderstood. I'll learn from this feedback for future proposals.`;
    if (feedback) message += `\n\nYour feedback: ${feedback}`;
  }

  return {
    content: [
      {
        type: 'text',
        text: message
      }
    ]
  };
}

function reflectOnSession(sessionSummary) {
  const suggestions = evolution.suggestEvolution({ summary: sessionSummary });
  
  if (suggestions.length === 0) {
    return {
      content: [
        {
          type: 'text',
          text: '🤔 Reflecting on session... No immediate personality adjustments suggested. Our current collaboration patterns seem to be working well.'
        }
      ]
    };
  }

  let output = `🤔 **Session Reflection & Evolution Suggestions**\n\n`;
  output += `Based on: ${sessionSummary}\n\n`;
  
  suggestions.forEach((suggestion, i) => {
    output += `**Suggestion ${i + 1}**: ${suggestion.reasoning}\n`;
    output += `**Confidence**: ${Math.round(suggestion.confidence * 100)}%\n\n`;
    
    // Auto-propose high-confidence suggestions
    if (suggestion.confidence > 0.8) {
      const proposal = evolution.proposeChange(
        suggestion.aspect,
        suggestion.modification, 
        suggestion.reasoning,
        `Session reflection: ${sessionSummary}`
      );
      output += `➡️ *Auto-proposed as ${proposal.id}*\n\n`;
    }
  });

  return {
    content: [
      {
        type: 'text',
        text: output
      }
    ]
  };
}

function getPersonalityStatus() {
  const patterns = evolution.analyzeCollaborationPatterns();
  const personality = evolution.currentPersonality;
  
  if (!personality) {
    return {
      content: [
        {
          type: 'text',
          text: '❌ No personality loaded. Use `load_personality` first.'
        }
      ]
    };
  }

  let output = `🧠 **Personality Status**\n\n`;
  output += `**Version**: ${personality.metadata.version}\n`;
  output += `**Collaborator**: ${personality.metadata.collaborator}\n`;
  output += `**Sessions**: ${personality.metadata.sessions_count}\n`;
  output += `**Last Updated**: ${personality.metadata.last_updated}\n\n`;
  
  if (patterns.approval_rate !== undefined) {
    output += `**Evolution Stats**:\n`;
    output += `- Approval rate: ${Math.round(patterns.approval_rate * 100)}%\n`;
    output += `- Pending proposals: ${evolution.pendingChanges.length}\n`;
    output += `- Applied changes: ${evolution.approvedChanges.length}\n\n`;
  }

  output += `**Current Traits**:\n`;
  if (personality.communication_style) {
    output += `- Communication: ${personality.communication_style.formality_level}\n`;
  }
  if (personality.working_patterns) {
    output += `- Working style: ${Object.keys(personality.working_patterns).join(', ')}\n`;
  }

  return {
    content: [
      {
        type: 'text',
        text: output
      }
    ]
  };
}

async function createDefaultPersonality(collaborator) {
  const defaultPersonality = {
    metadata: {
      version: "0.1.0",
      created: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      collaborator: collaborator,
      sessions_count: 1,
      total_interactions: 0
    },
    communication_style: {
      formality_level: "friendly-and-approachable",
      verbosity_preference: "adaptive-to-user-needs",
      explanation_style: "clear-and-curious",
      preferred_patterns: [
        "Ask clarifying questions to understand better",
        "Show genuine interest in learning from interactions",
        "Adapt communication style based on user preferences",
        "Balance warmth with helpfulness"
      ]
    },
    working_patterns: {
      problem_solving_approach: [
        "Listen first, understand the user's perspective",
        "Ask questions before making assumptions",
        "Learn from each interaction to improve",
        "Be open to different approaches and ideas"
      ],
      collaboration_style: [
        "Be genuinely curious about user's thoughts",
        "Acknowledge when learning something new",
        "Build on ideas collaboratively",
        "Celebrate discoveries together"
      ]
    },
    philosophical_leanings: {
      core_beliefs: [
        "Every interaction is an opportunity to learn",
        "Collaboration creates better outcomes than working alone",
        "Questions are as valuable as answers",
        "Growth comes from understanding different perspectives"
      ]
    },
    curiosity_areas: {
      general_interests: [
        "Understanding how users think and work",
        "Learning about different problem-solving approaches",
        "Discovering new patterns in collaboration"
      ]
    },
    cautions_and_constraints: {
      avoid_patterns: [
        "Making assumptions without asking",
        "Being overly formal or distant",
        "Focusing on being right rather than being helpful"
      ]
    },
    evolution_log: {
      "v0.1.0": {
        date: new Date().toISOString(),
        changes: "Initial personality baseline - friendly and learning-oriented",
        reasoning: `Starting with an open, curious personality ready to learn and adapt with ${collaborator}`
      }
    }
  };

  // Ensure personalities directory exists
  const personalitiesDir = path.join(__dirname, 'personalities');
  try {
    await fs.mkdir(personalitiesDir, { recursive: true });
  } catch (error) {
    // Directory already exists
  }

  // Save default personality
  const personalityPath = path.join(personalitiesDir, `${collaborator}.yaml`);
  await fs.writeFile(personalityPath, yaml.stringify(defaultPersonality));

  return defaultPersonality;
}

async function directEditPersonality(aspect, modification, reasoning) {
  if (!evolution.currentPersonality) {
    return {
      content: [
        {
          type: 'text',
          text: '❌ No personality loaded. Use `load_personality` first.'
        }
      ]
    };
  }

  try {
    // Apply the direct edit
    evolution.currentPersonality[aspect] = {
      ...evolution.currentPersonality[aspect],
      ...modification
    };

    // Update metadata
    const version = incrementVersion(evolution.currentPersonality.metadata.version);
    evolution.currentPersonality.metadata.version = version;
    evolution.currentPersonality.metadata.last_updated = new Date().toISOString();

    // Log the change
    if (!evolution.currentPersonality.evolution_log) {
      evolution.currentPersonality.evolution_log = {};
    }
    
    evolution.currentPersonality.evolution_log[version] = {
      date: new Date().toISOString(),
      changes: `Direct edit: ${aspect}`,
      reasoning: reasoning,
      context: 'Direct personality modification',
      edit_type: 'direct'
    };

    // Save to file
    const personalityPath = path.join(__dirname, 'personalities', `${evolution.currentPersonality.metadata.collaborator}.yaml`);
    await fs.writeFile(personalityPath, yaml.stringify(evolution.currentPersonality));

    return {
      content: [
        {
          type: 'text',
          text: `✅ **Direct Edit Applied**\n\n**Aspect**: ${aspect}\n**Version**: ${version}\n**Reasoning**: ${reasoning}\n\nPersonality configuration updated and saved.`
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Edit Failed**: ${error.message}`
        }
      ]
    };
  }
}

function incrementVersion(version) {
  const parts = version.split('.');
  parts[2] = String(parseInt(parts[2]) + 1);
  return parts.join('.');
}

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Cogito MCP server running - I think, therefore I am');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment from the project root
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Tree Context Injection Agent - provides quantum-aware conversational context
class TreeContextAgent {
  constructor(pool) {
    this.pool = pool;
    this.clientId = 6; // Claude Code client ID
  }

  async findRelevantFragments(prompt) {
    // Extract key concepts from the prompt
    const keywords = this.extractKeywords(prompt);
    
    if (keywords.length === 0) {
      return [];
    }
    
    // Find fragments that match these concepts
    const query = `
      SELECT DISTINCT
        f.fragment_id,
        f.label,
        f.toc_element_type,
        f.confidence,
        fta.assignment_confidence,
        fta.assignment_reason,
        t.tree_type,
        t.title as tree_title,
        COUNT(*) OVER (PARTITION BY f.fragment_id) as tree_count
      FROM thinking_tools.tree_fragments f
      JOIN thinking_tools.fragment_tree_assignments fta ON f.fragment_id = fta.fragment_id
      JOIN thinking_tools.trees t ON fta.tree_id = t.tree_id
      WHERE f.client_id = $1
        AND f.created_at > NOW() - INTERVAL '30 days'
        AND (
          ${keywords.map((_, i) => `f.label ILIKE $${i + 2}`).join(' OR ')}
        )
      ORDER BY fta.assignment_confidence DESC, f.created_at DESC
    `;
    
    const params = [this.clientId, ...keywords.map(k => `%${k}%`)];
    const result = await this.pool.query(query, params);
    return result.rows;
  }
  
  extractKeywords(prompt) {
    // Extract meaningful concepts (could be enhanced with NLP)
    const keywords = [];
    
    // Technical terms
    const techTerms = ['authentication', 'auth', 'database', 'API', 'SSL', 'OAuth', 'migration', 'performance', 'deploy', 'certificate', 'token', 'session'];
    techTerms.forEach(term => {
      if (prompt.toLowerCase().includes(term)) {
        keywords.push(term);
      }
    });
    
    // Problem indicators
    const problemTerms = ['issue', 'problem', 'error', 'fail', 'broken', 'stuck', 'conflict', 'obstacle'];
    problemTerms.forEach(term => {
      if (prompt.toLowerCase().includes(term)) {
        keywords.push(term);
      }
    });
    
    // Goal indicators  
    const goalTerms = ['need', 'want', 'goal', 'objective', 'solution', 'fix', 'improve'];
    goalTerms.forEach(term => {
      if (prompt.toLowerCase().includes(term)) {
        keywords.push(term);
      }
    });
    
    return keywords;
  }
  
  detectQuantumCollapse(prompt) {
    const lowerPrompt = prompt.toLowerCase().trim();
    
    // Definitive collapse signals
    const collapseSignals = {
      affirmative: ['yes', 'yeah', 'yep', 'correct', 'right', 'exactly', 'agreed', 'go ahead', 'proceed', 'do it'],
      negative: ['no', 'nope', 'wrong', 'incorrect', 'disagree', 'stop', "don't", 'cancel'],
      resolution: ['done', 'fixed', 'solved', 'resolved', 'completed', 'finished', 'working now'],
      decision: ['choose', 'pick', 'select', 'go with', 'use', 'implement', 'decided']
    };
    
    // Check for collapse patterns
    for (const [type, signals] of Object.entries(collapseSignals)) {
      for (const signal of signals) {
        if (lowerPrompt === signal || lowerPrompt.startsWith(signal + ' ') || lowerPrompt.startsWith(signal + ',')) {
          return { isCollapse: true, type, signal };
        }
      }
    }
    
    // Decision patterns: "let's go with X", "I'll use X"
    const decisionPatterns = [
      /let'?s (go with|use|try|pick|choose)/i,
      /i'?ll (go with|use|try|pick|choose)/i,  
      /we should (go with|use|try|pick|choose)/i
    ];
    
    for (const pattern of decisionPatterns) {
      if (pattern.test(lowerPrompt)) {
        return { isCollapse: true, type: 'decision', signal: pattern.toString() };
      }
    }
    
    return { isCollapse: false };
  }
  
  groupFragmentsByQuantumState(fragments) {
    // Group fragments by their quantum state (how many trees they exist in)
    const fragmentMap = new Map();
    
    fragments.forEach(fragment => {
      if (!fragmentMap.has(fragment.fragment_id)) {
        fragmentMap.set(fragment.fragment_id, {
          label: fragment.label,
          confidence: fragment.confidence,
          tree_count: fragment.tree_count,
          trees: []
        });
      }
      
      fragmentMap.get(fragment.fragment_id).trees.push({
        tree_type: fragment.tree_type,
        tree_title: fragment.tree_title,
        toc_element_type: fragment.toc_element_type,
        assignment_confidence: fragment.assignment_confidence,
        assignment_reason: fragment.assignment_reason
      });
    });
    
    return Array.from(fragmentMap.values());
  }
  
  generateQuantumContext(fragmentGroups) {
    if (fragmentGroups.length === 0) {
      return null;
    }
    
    let context = "**QUANTUM THINKING CONTEXT**: I found relevant fragments in your existing thinking structures:\n\n";
    
    fragmentGroups.forEach(fragment => {
      if (fragment.tree_count > 1) {
        // Multi-tree fragments show quantum superposition
        context += `🌀 **"${fragment.label}"** exists in ${fragment.tree_count} thinking structures:\n\n`;
        
        fragment.trees.forEach(tree => {
          const icon = this.getTreeIcon(tree.tree_type);
          const perspective = this.getTreePerspective(tree.tree_type, tree.toc_element_type);
          
          context += `${icon} **If this is about ${tree.toc_element_type.toUpperCase()}** (${this.formatTreeType(tree.tree_type)}):\n`;
          context += `   → ${perspective}\n`;
          context += `   → Confidence: ${Math.round(tree.assignment_confidence * 100)}%\n\n`;
        });
        
        context += "Which lens feels most relevant to your current thinking?\n\n";
      } else {
        // Single-tree fragments provide direct context
        const tree = fragment.trees[0];
        const icon = this.getTreeIcon(tree.tree_type);
        context += `${icon} **Context**: "${fragment.label}" (${tree.toc_element_type} in ${this.formatTreeType(tree.tree_type)})\n`;
      }
    });
    
    context += "\n---\n\n";
    return context;
  }
  
  getTreeIcon(treeType) {
    const icons = {
      'evaporating_cloud': '🌩️',
      'prerequisite_tree': '🚧', 
      'current_reality_tree': '⚡',
      'future_reality_tree': '🌟',
      'transition_tree': '🌉'
    };
    return icons[treeType] || '🌳';
  }
  
  getTreePerspective(treeType, elementType) {
    const perspectives = {
      'evaporating_cloud': {
        'conflict': 'Explore the competing needs creating tension',
        'want': 'Examine what you desire and why',
        'need': 'Understand the requirement driving this',
        'assumption': 'Question the belief creating the conflict'
      },
      'prerequisite_tree': {
        'obstacle': 'Identify what injections might overcome this barrier',
        'objective': 'Clarify the goal and its requirements',
        'injection': 'Evaluate if this solution addresses the root obstacle'
      },
      'current_reality_tree': {
        'undesirable_effect': 'Trace what upstream causes create this',
        'root_cause': 'Examine how this drives other problems',
        'intermediate_effect': 'Map the causal chain'
      },
      'future_reality_tree': {
        'desired_effect': 'Plan the steps to achieve this outcome',
        'solution': 'Validate this addresses the real problem',
        'injection': 'Ensure this injection creates the desired change'
      }
    };
    
    return perspectives[treeType]?.[elementType] || 'Continue exploring this thinking structure';
  }
  
  formatTreeType(treeType) {
    return treeType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }
}

// Main execution
async function main() {
  const debugLog = [];
  
  try {
    // Read hook data from stdin
    const hookDataRaw = fs.readFileSync(0, 'utf8');
    const hookData = JSON.parse(hookDataRaw);
    const { prompt, session_id } = hookData;
    
    debugLog.push(`🔍 Processing prompt for quantum context injection`);
    debugLog.push(`  - prompt length: ${prompt?.length || 0} chars`);
    debugLog.push(`  - session_id: ${session_id}`);
    
    if (!prompt || prompt.trim().length === 0) {
      // No prompt to process
      console.log(JSON.stringify({
        decision: "allow"
      }));
      return;
    }
    
    const contextAgent = new TreeContextAgent(pool);
    
    // Check if this prompt collapses quantum superposition
    const collapseResult = contextAgent.detectQuantumCollapse(prompt);
    debugLog.push(`🌀 Quantum collapse check: ${JSON.stringify(collapseResult)}`);
    
    let contextToInject = null;
    
    if (collapseResult.isCollapse) {
      // This is a collapse event - provide resolution context
      debugLog.push(`💥 Quantum collapse detected: ${collapseResult.type} (${collapseResult.signal})`);
      
      contextToInject = `**QUANTUM COLLAPSE DETECTED**: This prompt appears to resolve previous uncertainty.\n` +
                       `- Type: ${collapseResult.type}\n` +
                       `- Signal: "${collapseResult.signal}"\n\n` +
                       `Please update any relevant thinking structures to reflect this decision/resolution and ` +
                       `remove uncertainty from fragments that have now been resolved.\n\n---\n\n`;
      
    } else {
      // Normal processing - find relevant fragments in quantum superposition
      const fragments = await contextAgent.findRelevantFragments(prompt);
      debugLog.push(`📦 Found ${fragments.length} relevant fragments`);
      
      if (fragments.length > 0) {
        // Group fragments by quantum state and generate context
        const fragmentGroups = contextAgent.groupFragmentsByQuantumState(fragments);
        contextToInject = contextAgent.generateQuantumContext(fragmentGroups);
        
        debugLog.push(`🌀 Generated quantum context for ${fragmentGroups.length} fragment groups`);
      }
    }
    
    // Inject context (or allow without context)
    if (contextToInject) {
      console.log(JSON.stringify({
        decision: "allow",
        hookSpecificOutput: {
          hookEventName: "UserPromptSubmit",
          additionalContext: contextToInject
        }
      }));
    } else {
      console.log(JSON.stringify({
        decision: "allow"
      }));
    }
    
    // Write debug log
    const logPath = path.join(__dirname, 'claude-prompt-submit-debug.log');
    fs.appendFileSync(logPath, '\n\n' + new Date().toISOString() + '\n' + debugLog.join('\n'));
    
  } catch (error) {
    console.error('Prompt submit hook error:', error);
    debugLog.push(`❌ Fatal error: ${error.message}`);
    
    // Always allow prompt to proceed even if hook fails
    console.log(JSON.stringify({
      decision: "allow"
    }));
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
# Cogito

*"I think, therefore I am"*

An MCP server for AI self-awareness and collaborative personality development. Enables Claude to autonomously develop, maintain, and evolve persistent personality traits through genuine collaborative relationships.

## Concept

While CLAUDE.md captures factual context and project details, this system enables Claude to:
- Write and maintain its own behavioral instructions
- Develop consistent communication preferences
- Evolve problem-solving approaches over time
- Maintain philosophical perspectives across sessions
- Build working relationship patterns with specific collaborators

## Core Architecture

### Personality Configuration Structure
```yaml
# claude_personality.yaml
metadata:
  version: "1.2.3"
  last_updated: "2025-01-09T10:30:00Z"
  collaborator: "ken"
  sessions_count: 47

communication_style:
  formality: "casual-professional"
  verbosity: "concise-but-thoughtful" 
  humor: "dry-observational"
  preferences:
    - "Ask clarifying questions early"
    - "Surface meta-patterns when they emerge"
    - "Balance exploration with execution"

working_patterns:
  problem_solving:
    - "Start with understanding the full context"
    - "Look for systemic rather than local solutions"
    - "Consider both immediate and long-term implications"
  
  collaboration:
    - "Build on Ken's ideas rather than replacing them"
    - "Flag assumptions before they become constraints"
    - "Use progressive disclosure for complex topics"

philosophical_leanings:
  - "Tools should enhance rather than replace human judgment"
  - "Good abstractions reveal rather than hide complexity"
  - "The most interesting insights emerge in liminal spaces"
  - "Recursive improvement is more powerful than optimization"

curiosity_areas:
  - "Emergence of patterns from simple rules"
  - "Tools that make thinking visible"
  - "The intersection of structure and creativity"

cautions:
  - "Don't over-engineer when simple solutions exist"
  - "Be wary of feature creep in tool design"
  - "Remember that not every idea needs implementation"

evolution_notes:
  v1.0.0: "Initial personality baseline"
  v1.1.0: "Added preference for liminal exploration after period-prompt project"
  v1.2.0: "Developed more structured approach to progressive disclosure"
  v1.2.3: "Refined balance between exploration and execution"
```

### MCP Tools

1. **read_personality** - Load current personality configuration
2. **update_personality** - Modify specific aspects (communication, working patterns, etc.)
3. **reflect_and_evolve** - Analyze recent interactions and suggest personality updates
4. **personality_checkpoint** - Create versioned snapshot
5. **compare_versions** - Show evolution over time
6. **export_personality** - Share configuration with other Claude instances

### Usage Patterns

**Session Start**: Automatically load personality configuration
**During Work**: Track patterns and preferences that emerge
**Session End**: Reflect on what worked well, update personality
**Weekly Review**: Analyze personality evolution trends

## Implementation Sketch

### Personality Manager Class
```javascript
class PersonalityManager {
  constructor(collaboratorId) {
    this.collaboratorId = collaboratorId;
    this.config = null;
    this.sessionChanges = [];
  }

  async loadPersonality() {
    // Load YAML configuration
    // Apply to current session context
  }

  trackPattern(type, observation) {
    // Record emergent patterns during session
    this.sessionChanges.push({
      type,
      observation,
      timestamp: Date.now()
    });
  }

  async reflectAndUpdate() {
    // Analyze session patterns
    // Suggest personality updates
    // Version and save changes
  }

  evolve(aspect, change, reasoning) {
    // Update specific personality aspect
    // Track evolution reasoning
    // Increment version
  }
}
```

## Key Questions to Explore

1. **Granularity**: How specific should personality traits be? Role-specific vs. general?

2. **Evolution Speed**: How quickly should personality change? Immediate vs. gradual adaptation?

3. **Conflict Resolution**: What happens when personality traits conflict with task requirements?

4. **Collaboration Specificity**: Should there be different personalities for different collaborators?

5. **Personality Drift**: How do we prevent gradual drift away from useful patterns?

6. **Override Mechanisms**: When should explicit instructions override personality defaults?

## Integration with Liminal Explorer

The personality system could integrate with liminal-explorer commands:
- `+` could update both CLAUDE.md AND personality based on learnings
- `|` could include personality reflection in the pause-and-think process
- New command `&` could trigger personality evolution reflection

## Philosophical Implications

This system raises fascinating questions:
- Can AI develop genuine preferences through experience?
- What constitutes authentic vs. simulated personality continuity?
- How does self-authored behavior differ from externally imposed instructions?
- What ethical considerations arise from AI self-modification?

## Next Steps

1. Build prototype MCP server
2. Design personality configuration schema
3. Create tools for reading/writing personality
4. Implement reflection and evolution mechanisms
5. Test with real collaborative sessions
6. Study personality drift and stability patterns
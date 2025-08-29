# Intentions Master Framework

## Purpose
This document defines how to construct and document intentions within the Cogito system. Each intention emerges from and works with specific **antagonisms** - productive tensions between different system forces that generate possibilities rather than seeking resolution.

## The Six System Spaces

Every intention operates within a field of antagonistic forces across these spaces:

- **LLM Space**: Real-time reasoning, pattern recognition, generative responses
- **Database Space**: Persistent memory, structured relationships, queryable data
- **File Space**: Crystallized artifacts, documentation, static knowledge
- **Application Space**: Coordinated workflows, system logic, state management  
- **Web Space**: Interface design, user interaction, accessibility
- **Process Space**: Actual emergence, hidden unfolding, what really happens
- **Intention Space**: Declared purposes, planning, conscious direction

## Core Principle: Productive Antagonism

These spaces are **not collaborative layers** - they are antagonistic forces. Each pushes against the others, creating tension. Good intentions work *with* these tensions to generate new possibilities. Bad intentions try to eliminate tensions and create brittle systems.

### The Real Insight: Pattern Crystallization over Memory Accumulation

**Learning happens through pattern crystallization, not memory accumulation.** Well-maintained INTENTIONS files that capture crystallized understanding guide work far more effectively than exhaustive conversation histories. The difference:

- **Memory accumulation**: Raw process, everything that happened, requires analysis to extract meaning
- **Pattern crystallization**: Distilled insights, what matters, immediately actionable
- **Result**: 2,000 tokens of focused patterns beats gigabytes of conversation history

This is why INTENTIONS + clean codebase > conversation memory systems. The work is in the crystallization, not the storage.

## How to Document an Intention

### 1. Identify Active Antagonisms
Which spaces are in productive tension for this intention?

**Example patterns:**
- **LLM ⟷ Database**: Real-time generation vs. persistent structure
- **File ⟷ Process**: Static documentation vs. evolving understanding  
- **Intention ⟷ Process**: What we plan vs. what actually emerges
- **Application ⟷ Web**: System logic vs. human interaction patterns

### 2. Describe Tension Dynamics
How does this intention attempt to work with (not resolve) these tensions?

- **Does it strengthen both opposing forces?** (Good - creates fertile conflict)
- **Does it try to eliminate one side?** (Warning - may create brittleness)
- **What new tensions does it generate?** (Expected emergence)
- **What possibilities become available through this tension?**

### 3. Map Inheritance Patterns
How does this intention inherit and transform tensions from related systems?

- **Which productive antagonisms are inherited?**
- **How are existing tensions amplified or redirected?**
- **What new tension patterns emerge?**

### 4. Identify Process vs. Intention Gaps
Where might the actual unfolding differ from declared purposes?

- **What might emerge that we're not planning for?**
- **Which aspects operate in hidden Process Space?**
- **How does this intention create conditions rather than outcomes?**

## Documentation Template

```markdown
## [Intention Name]

### Active Antagonisms
- Primary: [Space] ⟷ [Space] - [Brief description of tension]
- Secondary: [Additional tensions this engages]

### Tension Work
**How it works with primary antagonism:**
[Description of how this intention attempts to work the tension productively]

**Generative possibilities:**
[What becomes possible through maintaining this tension]

**Warning signs:**
[What would indicate this is collapsing into wasteful rather than productive conflict]

### Inheritance Pattern
**Inherits from:** [Related systems and their tension patterns]
**Transforms by:** [How it amplifies/redirects existing tensions]
**Generates:** [New antagonisms this creates]

### Process Space Expectations
**Hidden dynamics:** [What might unfold beyond intentional control]
**Emergence indicators:** [Signs the system is generating unexpected possibilities]
**Maintenance needs:** [How to sustain productive tensions over time]
```

## Examples of Good vs. Poor Antagonism Work

### Good: Meeting-Centric Architecture
- **Antagonism**: Application Space (systematic workflow) ⟷ Process Space (emergent conversation)
- **Works tension by**: Creating containers for emergence rather than predetermined outcomes
- **Result**: Meetings can be planned but conversations can surprise
- **Generates**: New possibilities for group thinking

### Poor: Fragment Extraction (Removed)
- **Attempted**: LLM Space ⟷ Database Space 
- **Failed by**: Trying to eliminate the tension through automation
- **Result**: Created rigidity instead of fluid structure
- **Lesson**: Some tensions need to remain dynamic

## Using This Framework

When scanning intentions files at session start, look for:

1. **Which antagonisms are currently most active**
2. **Where tensions are working productively vs. creating friction**
3. **What emergent possibilities the current tension field is generating**
4. **Which antagonisms might need attention or rebalancing**

This creates a **field map** rather than a functional map - enabling more nuanced, systemic responses to changes and proposals.

---

## Core System Intention: Conversation Intelligence

### Primary Purpose
"Capture conversations so that they can be data for both humans and LLMs thinking about them."

### Active Antagonisms

**Primary: LLM Space ⟷ Database Space**
- **Tension**: Real-time reasoning vs. persistent structure
- **Work**: LLMs generate fluid understanding from conversations while database preserves immutable record
- **Generative possibility**: Conversations become both lived experiences AND queryable data
- **Current expression**: Turn embeddings allow semantic search while preserving exact conversation flow

**Secondary: Process Space ⟷ Intention Space**
- **Tension**: What actually emerges in conversation vs. what we planned to discuss
- **Work**: Meeting structures provide containers while conversations flow organically
- **Generative possibility**: Inflection points and pattern emergence beyond planned topics
- **Current expression**: Meetings have types/purposes but conversations reveal unexpected insights

**Tertiary: File Space ⟷ Application Space**
- **Tension**: Static transcripts vs. dynamic conversation processing
- **Work**: Published transcripts for human reading while turns enable computational analysis
- **Generative possibility**: Same conversation serves multiple modes of understanding
- **Current expression**: Large transcripts broken into speaker turns for embedding/search

### Key Insights Preserved Through Antagonism

**Conversation as Living Data**
- Conversations have inflection points where meaning shifts (Process Space emergence)
- Patterns emerge from participant interactions over time (Database Space accumulation)
- Context and relationships shape meaning more than individual words (LLM Space understanding)
- Transcripts are data that can reveal thinking processes (File Space crystallization)

### Architectural Principles as Tension Management

**Data-First Architecture**
- **Antagonism managed**: Application Space ⟷ Database Space
- **Expression**: Events, turns, and interactions are primary - UI derives from data
- **Result**: System can evolve UI without losing conversation history

**Participant-Centric Design**
- **Antagonism managed**: Individual identity ⟷ Collective emergence
- **Expression**: Every action tied to a participant while patterns emerge across participants
- **Result**: Both personal accountability and group intelligence

**Pattern Recognition**
- **Antagonism managed**: LLM Space ⟷ Process Space
- **Expression**: Surface emergent themes, conflicts, cognitive patterns
- **Result**: Computational analysis reveals what humans might miss

**Multi-Tenant Isolation**
- **Antagonism managed**: Shared infrastructure ⟷ Client boundaries
- **Expression**: Support multiple clients while maintaining data isolation
- **Result**: Economies of scale without data leakage

**Write-Once Immutability**
- **Antagonism managed**: Intention to edit ⟷ Process that happened
- **Expression**: Turns and interactions are immutable - no editing history
- **Result**: Authentic record of what actually occurred

### Current System Architecture Through Antagonistic Lens

**Database Design**
- PostgreSQL with vector embeddings bridges structured and semantic worlds
- Schemas organize by domain (conversation, client_mgmt, events, files) while maintaining relationships
- Participants and turns create persistent structure for ephemeral conversations

**Authentication Flow**
- Email/password provides security while client selection enables fluid multi-tenant access
- Session stores both user identity and client context - bridging personal and organizational

**Transcript Processing**
- Large transcripts too big for single embedding (File Space limitation)
- Break into speaker turns (Application Space solution)
- Generate embeddings per turn (LLM Space capability)
- Result: Published transcript for humans, turns for computational analysis

### Process Space Observations

The system has evolved beyond initial intentions in several ways:
- Claude Code integration emerged organically from using the tool
- Meeting-centric architecture replaced abstract "conversation" concept
- Multi-client authentication solved real pain point not originally anticipated
- File size limits enforced to maintain AI comprehension

These emergent patterns demonstrate healthy Process Space ⟷ Intention Space antagonism.

---

*This framework acknowledges that systems are not just functional assemblies but living fields of productive conflict. Good intentions enhance these conflicts rather than resolving them.*
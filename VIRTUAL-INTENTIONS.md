# Virtual Intentions - Dormant but Worthy Ideas

This file documents **good ideas that are not currently implemented** but represent valuable intellectual work that could be revived in the future.

## Purpose

- **Preserve intellectual work**: Don't lose good ideas when removing unused code
- **Enable clean revival**: Provide enough detail for AI to recreate features accurately
- **Maintain code archaeology**: Track the evolution of ideas and why they were shelved
- **Support decision making**: Help evaluate whether dormant features should be revived

## Format

Each virtual intention should include:
- **Original purpose**: What problem it was meant to solve
- **Implementation approach**: Key technical decisions and patterns used
- **Current status**: Why it's not currently active
- **Revival requirements**: What would be needed to bring it back
- **Code locations**: Where the code lived (for reference)

---

## AI Agents & Processing Systems

### Fragment Extraction Agent
**Original Purpose**: Automatically extract meaningful fragments from conversation transcripts for analysis and tree assembly.

**Implementation Approach**:
- Pattern-based extraction using regex and NLP techniques
- Database storage of fragments with metadata
- Turn retrieval system for context gathering
- Integration with tree assembly pipeline

**Current Status**: Built but not integrated into main conversation flow. The system works but we haven't found the right UX for exposing fragment analysis to users.

**Revival Requirements**:
- Define clear user workflows for fragment analysis
- Integrate with conversation UI
- Performance optimization for real-time processing
- User controls for fragment sensitivity/filtering

**Code Locations**: `ai-agents/fragment-extraction-agent/`, `ai-agents/fragment-extraction/`

### Tree Assembly Agent
**Original Purpose**: Automatically organize conversation fragments into hierarchical tree structures for better information organization.

**Implementation Approach**:
- Pattern detection for different content types (lists, hierarchies, Q&A)
- Fragment grouping based on semantic similarity
- Tree structure inference with different layouts (radial, flowchart, etc.)
- Database storage of assembled trees

**Current Status**: Complete implementation but no UI integration. The AI can detect patterns and build trees, but we haven't built user-facing tree visualization.

**Revival Requirements**:
- Tree visualization UI components
- User interaction patterns for tree navigation
- Integration with conversation context
- Export/sharing functionality for trees

**Code Locations**: `ai-agents/tree-assembly-agent/`, split into multiple focused modules

### Speaker Profile Agent
**Original Purpose**: Build profiles of conversation participants to enhance context and personalization.

**Implementation Approach**:
- Speaker identification from conversation patterns
- Profile generation based on communication style
- Profile storage and retrieval system
- Integration with conversation context

**Current Status**: Implemented but raises privacy concerns. We haven't established clear consent and data usage policies for speaker profiling.

**Revival Requirements**:
- Privacy policy framework for speaker data
- User consent mechanisms
- Data retention and deletion policies
- Anonymization options

**Code Locations**: `ai-agents/speaker-profile-agent/`

### Turn Embedding Agent
**Original Purpose**: Generate semantic embeddings for all conversation turns to enable similarity search and context retrieval.

**Implementation Approach**:
- Automatic embedding generation for new turns
- Retry handling for embedding failures
- Turn storage with embedding metadata
- Integration with similarity search

**Current Status**: Partially integrated. The embedding generation works but we're still optimizing the similarity search and context retrieval algorithms.

**Revival Requirements**:
- Optimize embedding model selection
- Tune similarity thresholds
- Improve context relevance scoring
- Better error handling and monitoring

**Code Locations**: `ai-agents/turn-embedding-agent/`

---

## Classification Systems

### Interaction Classifier
**Original Purpose**: Automatically classify different types of interactions in conversations (thinking, planning, milestones, etc.).

**Implementation Approach**:
- Pattern-based classification using content analysis
- Multiple specialized detectors for different interaction types
- Classification confidence scoring
- Integration with conversation analytics

**Current Status**: Built but not exposed in UI. The classification works but we haven't determined how to present this information usefully to users.

**Revival Requirements**:
- UI design for interaction classification display
- User feedback mechanisms for classification accuracy
- Integration with conversation search and filtering
- Performance optimization for real-time classification

**Code Locations**: `classification/interaction-classifier/`

### Client Detector
**Original Purpose**: Automatically detect and identify client organizations from conversation content for better multi-tenant organization.

**Implementation Approach**:
- Client name extraction from conversation patterns
- Client organization search and matching
- Result formatting and confidence scoring
- Integration with client management system

**Current Status**: Implemented but not actively used. We found manual client assignment to be more reliable than automatic detection.

**Revival Requirements**:
- Improve detection accuracy
- Handle edge cases in client identification
- Integration with client onboarding flow
- User review and approval workflow

**Code Locations**: `classification/client-detector/`

---

## Services & Infrastructure

### How-To Service
**Original Purpose**: Provide contextual help and guidance system integrated with the application.

**Implementation Approach**:
- Guide management system for creating help content
- Search operations for finding relevant guides
- Usage tracking for guide effectiveness
- Integration with application workflows

**Current Status**: Built but content not created. The system works but we haven't invested in creating comprehensive help content.

**Revival Requirements**:
- Content creation strategy and resources
- Guide authoring workflow
- Integration points throughout the application
- Analytics for help effectiveness

**Code Locations**: `services/how-to-service/`

### Location Manager
**Original Purpose**: Provide location-aware features and geographic context for conversations.

**Implementation Approach**:
- Location detection and storage
- Geographic context enrichment
- Location-based search and filtering
- Integration with conversation metadata

**Current Status**: Implemented but feature scope unclear. We haven't defined clear use cases for location features in our conversation system.

**Revival Requirements**:
- Define clear location-based use cases
- Privacy considerations for location data
- UI design for location features
- Performance optimization for location queries

**Code Locations**: `services/location-manager.js`

---

## Integration Systems

### MCP Game State Integration
**Original Purpose**: Integration with Model Context Protocol for game state management in design games.

**Implementation Approach**:
- MCP server implementation for game state
- Tool handlers for game state operations
- Schema definitions for game data
- Integration with design games system

**Current Status**: Implemented but design games feature not actively used. The MCP integration works but the broader design games system needs product direction.

**Revival Requirements**:
- Product strategy for design games
- User research on collaborative design workflows
- UI/UX design for game interactions
- Integration with broader collaboration features

**Code Locations**: `integrations/mcp-game-state/`

---

## Notes on Revival Strategy

When considering reviving any of these systems:

1. **Assess Current Relevance**: Do the original problems still exist?
2. **Evaluate Dependencies**: What other systems would need updating?
3. **Consider User Research**: Have user needs evolved since original implementation?
4. **Check Technical Debt**: Are the implementation approaches still valid?
5. **Resource Planning**: What would full revival and integration require?

---

*This file should be updated whenever good ideas are shelved or when dormant ideas are revived into active development.*
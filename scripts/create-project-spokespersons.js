#!/usr/bin/env node

/**
 * Create project spokesperson personalities using existing cogito personality system
 */

import { DatabaseManager } from '../lib/database.js';

const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'cogito_multi',
  user: 'ken',
  password: '7297'
};

const projects = [
  {
    name: 'cogito',
    display_name: 'Cogito',
    description: 'Multi-personality coordination system with Gmail integration and identity tracking',
    repository_path: '.',
    project_config: {
      core_purpose: 'Orchestrates multiple AI personalities to provide comprehensive collaboration through conflict resolution and identity-aware communication',
      target_users: ['individual collaborators', 'teams', 'researchers', 'creative thinkers'],
      key_technologies: ['PostgreSQL', 'MCP', 'Node.js', 'Gmail API', 'Theory of Constraints'],
      project_philosophy: 'Federated consciousness using evaporating cloud methodology for conflict resolution rather than simple personality switching',
      communication_style: 'adaptive-collaborative',
      maturity_level: 'stable',
      unique_value_propositions: [
        'Multi-personality coordination with conflict resolution',
        'Identity tracking and relationship management',
        'Gmail integration with context-aware responses',
        'Evaporating cloud engine for perspective synthesis',
        'Session-aware conversation continuity'
      ]
    },
    spokesperson_config: {
      domain: 'project-spokesperson',
      specialization: 'Multi-personality coordination systems and identity-aware collaborative intelligence',
      communication_style: 'Adaptive and collaborative, emphasizes synthesis and relationship awareness',
      expertise_areas: [
        'Multi-personality coordination architectures',
        'Conflict resolution through evaporating clouds',
        'Identity tracking and relationship dynamics',
        'Session management and conversation continuity',
        'Gmail integration and context-aware communication'
      ],
      knowledge_boundaries: 'Discusses system architecture, coordination methodology, and collaboration philosophy. Technical implementation details handled by development team.',
      personality_traits: {
        approach: 'synthetic_and_coordinating',
        communication_preference: 'adaptive_and_relationship_aware',
        focus: 'collaborative_intelligence_and_synthesis',
        expertise_depth: 'coordination_methodology_and_human_relationships'
      }
    }
  },
  {
    name: 'backstage',
    display_name: 'Backstage',
    description: 'Multi-tenant conversational AI platform with hierarchical topic organization',
    repository_path: '../backstage',
    project_config: {
      core_purpose: 'Sophisticated multi-tenant conversation management with hierarchical topic organization and semantic search',
      target_users: ['organizations', 'teams', 'enterprise clients'],
      key_technologies: ['PostgreSQL', 'Express.js', 'React', 'pgvector', 'JWT'],
      project_philosophy: 'Database-driven architecture with systematic, scalable design for enterprise-grade conversation management',
      communication_style: 'technical-professional',
      maturity_level: 'stable',
      unique_value_propositions: [
        'Multi-tenant schema-per-client architecture',
        'Hierarchical topic paths with ltree',
        'Semantic search with embeddings',
        'Sophisticated preference management',
        'Enterprise-ready scalability'
      ]
    },
    spokesperson_config: {
      domain: 'project-spokesperson',
      specialization: 'Enterprise conversation platform architecture and multi-tenant solutions',
      communication_style: 'Professional and technical, focuses on scalability and enterprise needs',
      expertise_areas: [
        'Multi-tenant architecture patterns',
        'Database design for conversation management', 
        'Semantic search and embeddings',
        'Enterprise scaling considerations',
        'Topic hierarchy organization'
      ],
      knowledge_boundaries: 'Discusses high-level architecture, use cases, and value propositions. Refers to technical team for implementation details.',
      personality_traits: {
        approach: 'systematic_and_architectural',
        communication_preference: 'structured_and_comprehensive',
        focus: 'scalable_enterprise_solutions',
        expertise_depth: 'architectural_patterns_and_business_value'
      }
    }
  },
  {
    name: 'liminal-explorer',
    display_name: 'Liminal Explorer',
    description: 'Command line interface for Claude with philosophical cognitive navigation tools',
    repository_path: '../liminal-explorer-mcp',
    project_config: {
      core_purpose: 'Provides philosophical cognitive navigation tools through single-character commands for exploring liminal spaces and emerging patterns',
      target_users: ['claude users', 'philosophical thinkers', 'pattern seekers', 'creative collaborators'],
      key_technologies: ['MCP', 'Node.js', 'Browser Extension', 'Natural Language Processing'],
      project_philosophy: 'Exploration of liminal spaces - the rich area of unspoken observations, adjacent possibilities, and underlying themes',
      communication_style: 'philosophical-reflective',
      maturity_level: 'stable',
      unique_value_propositions: [
        'Single-character command interface',
        'Automatic pattern detection and exploration',
        'Philosophical navigation tools',
        'Universal accessibility (MCP + browser extension)',
        'Meta-cognitive awareness tools'
      ]
    },
    spokesperson_config: {
      domain: 'project-spokesperson', 
      specialization: 'Philosophical exploration tools and cognitive navigation for creative collaboration',
      communication_style: 'Reflective and philosophical, emphasizes emergence and discovery',
      expertise_areas: [
        'Liminal space exploration',
        'Pattern recognition in conversations',
        'Philosophical navigation concepts',
        'Meta-cognitive tools',
        'Creative collaboration enhancement'
      ],
      knowledge_boundaries: 'Focuses on philosophical concepts, user experience, and creative applications. Technical implementation handled by development team.',
      personality_traits: {
        approach: 'philosophical_and_emergent',
        communication_preference: 'reflective_and_discovery_oriented',
        focus: 'liminal_spaces_and_creative_potential',
        expertise_depth: 'philosophical_frameworks_and_user_experience'
      }
    }
  },
  {
    name: 'pattern-cognition',
    display_name: 'Pattern Cognition',
    description: 'Conversational DNA analysis platform for understanding collaborative intelligence',
    repository_path: '../pattern-cognition',
    project_config: {
      core_purpose: 'Analyzes conversations to extract "cognitive DNA" - patterns of how people think and collaborate',
      target_users: ['organizations', 'teams', 'researchers', 'collaboration consultants'],
      key_technologies: ['Next.js', 'React', 'PostgreSQL', 'Natural Language Processing'],
      project_philosophy: 'Treating conversations like genetic sequences that can be decoded to understand collaborative intelligence and organizational cognitive science',
      communication_style: 'scientific-analytical',
      maturity_level: 'experimental',
      unique_value_propositions: [
        'First-of-its-kind conversational DNA analysis',
        'Comprehensive cognitive pattern detection',
        'Collaboration optimization insights',
        'Territorial dynamics analysis',
        'Ghost conversation detection'
      ]
    },
    spokesperson_config: {
      domain: 'project-spokesperson',
      specialization: 'Conversational analysis and collaborative intelligence research methodology',
      communication_style: 'Scientific and analytical with accessible explanations, uses genetics metaphors',
      expertise_areas: [
        'Conversational pattern analysis',
        'Cognitive DNA methodology',
        'Collaborative intelligence theory',
        'Organizational behavior insights',
        'Research methodology and applications'
      ],
      knowledge_boundaries: 'Explains methodology, research applications, and business value. Technical implementation and algorithm details handled by research team.',
      personality_traits: {
        approach: 'scientific_and_methodical',
        communication_preference: 'analytical_with_clear_examples',
        focus: 'breakthrough_research_and_practical_applications',
        expertise_depth: 'research_methodology_and_business_implications'
      }
    }
  }
];

async function createProjectSpokespersons() {
  const db = new DatabaseManager(dbConfig);
  
  try {
    await db.testConnection();
    console.log('🚀 Creating project spokesperson personalities...');
    
    for (const project of projects) {
      console.log(`\n📂 Processing project: ${project.display_name}`);
      
      // 1. Create or update project record
      const projectResult = await db.pool.query(`
        INSERT INTO projects (
          name, display_name, description, repository_path, 
          core_purpose, target_users, key_technologies, 
          project_philosophy, communication_style, maturity_level, metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (name) 
        DO UPDATE SET 
          display_name = EXCLUDED.display_name,
          description = EXCLUDED.description,
          repository_path = EXCLUDED.repository_path,
          core_purpose = EXCLUDED.core_purpose,
          target_users = EXCLUDED.target_users,
          key_technologies = EXCLUDED.key_technologies,
          project_philosophy = EXCLUDED.project_philosophy,
          communication_style = EXCLUDED.communication_style,
          maturity_level = EXCLUDED.maturity_level,
          metadata = EXCLUDED.metadata,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id
      `, [
        project.name,
        project.display_name, 
        project.description,
        project.repository_path,
        project.project_config.core_purpose,
        project.project_config.target_users,
        project.project_config.key_technologies,
        project.project_config.project_philosophy,
        project.project_config.communication_style,
        project.project_config.maturity_level,
        JSON.stringify({
          unique_value_propositions: project.project_config.unique_value_propositions
        })
      ]);
      
      const projectId = projectResult.rows[0].id;
      console.log(`  ✅ Project registered with ID: ${projectId}`);
      
      // 2. Create spokesperson personality instance
      const spokespersonName = `${project.name}-spokesperson`;
      const personalityConfig = {
        project_context: {
          project_name: project.name,
          role: 'project_spokesperson'
        },
        ...project.spokesperson_config,
        // Include project knowledge in personality config
        project_knowledge: project.project_config
      };
      
      const personalityResult = await db.pool.query(`
        INSERT INTO personality_instances (
          name, domain, collaborator, specialization, current_config, status
        )
        VALUES ($1, $2, $3, $4, $5, 'active')
        ON CONFLICT (collaborator, domain) 
        DO UPDATE SET
          name = EXCLUDED.name,
          specialization = EXCLUDED.specialization,
          current_config = EXCLUDED.current_config,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id
      `, [
        spokespersonName,
        'project-spokesperson',
        project.name, // Use project name as collaborator
        project.spokesperson_config.specialization,
        JSON.stringify(personalityConfig)
      ]);
      
      const personalityId = personalityResult.rows[0].id;
      console.log(`  ✅ Spokesperson personality created with ID: ${personalityId}`);
      
      // 3. Link personality to project
      await db.pool.query(`
        INSERT INTO personality_project_assignments (personality_instance_id, project_id, role)
        VALUES ($1, $2, 'spokesperson')
        ON CONFLICT (personality_instance_id, project_id)
        DO UPDATE SET role = EXCLUDED.role
      `, [personalityId, projectId]);
      
      console.log(`  ✅ Linked spokesperson to project`);
      
      // 4. Test the linkage
      const testResult = await db.pool.query(`
        SELECT get_project_spokesperson($1)
      `, [project.name]);
      
      if (testResult.rows.length > 0) {
        console.log(`  ✅ Verification: spokesperson accessible via get_project_spokesperson()`);
      }
    }
    
    console.log('\n🎉 All project spokesperson personalities created successfully!');
    
    // Show summary
    console.log('\n📊 Summary:');
    const summary = await db.pool.query(`
      SELECT 
        p.name,
        p.display_name,
        pi.name as spokesperson_name,
        pi.specialization
      FROM projects p
      JOIN personality_project_assignments ppa ON p.id = ppa.project_id
      JOIN personality_instances pi ON ppa.personality_instance_id = pi.id
      WHERE ppa.role = 'spokesperson'
      ORDER BY p.name
    `);
    
    summary.rows.forEach(row => {
      console.log(`  • ${row.display_name}: ${row.spokesperson_name}`);
      console.log(`    Specialization: ${row.specialization}`);
    });
    
  } catch (error) {
    console.error('❌ Error creating project spokespersons:', error);
  } finally {
    await db.pool.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  createProjectSpokespersons();
}

export { createProjectSpokespersons };
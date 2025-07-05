#!/usr/bin/env node

/**
 * Project Context Manager
 * 
 * Handles project context detection, switching, and persistence
 * for the cogito multi-personality coordination system.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ProjectContextManager {
  constructor(databaseManager) {
    this.db = databaseManager;
    this.currentProject = null;
    this.sessionState = new Map(); // Store context per session
  }

  /**
   * Auto-detect project context from various sources
   */
  async autoDetectProject(workingDirectory = process.cwd()) {
    try {
      // 1. Check CLAUDE.md for project context
      const claudeContext = await this.detectFromClaudemd(workingDirectory);
      if (claudeContext) {
        return claudeContext;
      }

      // 2. Check git repository name/remote
      const gitContext = await this.detectFromGit(workingDirectory);
      if (gitContext) {
        return gitContext;
      }

      // 3. Check directory name against known projects
      const dirContext = await this.detectFromDirectory(workingDirectory);
      if (dirContext) {
        return dirContext;
      }

      // 4. Default to cogito if we're in the cogito directory
      if (workingDirectory.includes('cogito')) {
        return 'cogito';
      }

      return null;
    } catch (error) {
      console.error('Project auto-detection failed:', error.message);
      return null;
    }
  }

  /**
   * Detect project from CLAUDE.md content
   */
  async detectFromClaudemd(workingDirectory) {
    try {
      const claudePath = path.join(workingDirectory, 'CLAUDE.md');
      const claudeContent = await fs.readFile(claudePath, 'utf-8');
      
      // Look for project context markers
      const projectMatch = claudeContent.match(/^#\s*Project:\s*(.+)$/mi) ||
                          claudeContent.match(/^#\s*(.+)$/m); // First heading
      
      if (projectMatch) {
        const projectName = projectMatch[1].toLowerCase().trim();
        return await this.validateProjectName(projectName);
      }
    } catch (error) {
      // CLAUDE.md doesn't exist or can't be read
    }
    return null;
  }

  /**
   * Detect project from git repository
   */
  async detectFromGit(workingDirectory) {
    try {
      const { execSync } = await import('child_process');
      
      // Get git remote URL
      const remoteUrl = execSync('git remote get-url origin', { 
        cwd: workingDirectory,
        encoding: 'utf-8'
      }).trim();
      
      // Extract repository name
      const repoMatch = remoteUrl.match(/\/([^\/]+?)(?:\.git)?$/);
      if (repoMatch) {
        const repoName = repoMatch[1].toLowerCase();
        return await this.validateProjectName(repoName);
      }
    } catch (error) {
      // Not a git repository or no remote
    }
    return null;
  }

  /**
   * Detect project from directory name
   */
  async detectFromDirectory(workingDirectory) {
    const dirName = path.basename(workingDirectory).toLowerCase();
    return await this.validateProjectName(dirName);
  }

  /**
   * Validate that a project name exists in our database
   */
  async validateProjectName(projectName) {
    try {
      const result = await this.db.pool.query(
        'SELECT name FROM projects WHERE name = $1 OR display_name ILIKE $2',
        [projectName, `%${projectName}%`]
      );
      
      if (result.rows.length > 0) {
        return result.rows[0].name;
      }
    } catch (error) {
      console.error('Project validation failed:', error.message);
    }
    return null;
  }

  /**
   * Get current project context for a session
   */
  getCurrentProject(sessionId = 'default') {
    return this.sessionState.get(sessionId) || this.currentProject;
  }

  /**
   * Set project context for a session
   */
  async setProjectContext(projectName, sessionId = 'default', persistent = true) {
    // Validate project exists
    const validatedProject = await this.validateProjectName(projectName);
    if (!validatedProject) {
      throw new Error(`Project '${projectName}' not found in database`);
    }

    // Set session context
    this.sessionState.set(sessionId, validatedProject);
    
    // Update global context if this is the main session
    if (sessionId === 'default' || persistent) {
      this.currentProject = validatedProject;
    }

    return validatedProject;
  }

  /**
   * Get project spokesperson personality
   */
  async getProjectSpokesperson(projectName = null) {
    const project = projectName || this.currentProject;
    if (!project) {
      return null;
    }

    try {
      const result = await this.db.pool.query(`
        SELECT 
          pi.id,
          pi.name,
          pi.specialization,
          pi.current_config,
          p.display_name as project_display_name
        FROM personality_instances pi
        JOIN personality_project_assignments ppa ON pi.id = ppa.personality_instance_id
        JOIN projects p ON ppa.project_id = p.id
        WHERE p.name = $1 
        AND ppa.role = 'spokesperson'
        AND pi.status = 'active'
        AND p.status = 'active'
      `, [project]);

      if (result.rows.length > 0) {
        return result.rows[0];
      }
    } catch (error) {
      console.error('Failed to get project spokesperson:', error.message);
    }
    return null;
  }

  /**
   * Get project information
   */
  async getProjectInfo(projectName = null) {
    const project = projectName || this.currentProject;
    if (!project) {
      return null;
    }

    try {
      const result = await this.db.pool.query(`
        SELECT 
          name,
          display_name,
          description,
          client_id,
          created_at,
          is_active
        FROM projects 
        WHERE name = $1
      `, [project]);

      if (result.rows.length > 0) {
        return result.rows[0];
      }
    } catch (error) {
      console.error('Failed to get project info:', error.message);
    }
    return null;
  }

  /**
   * List all available projects
   */
  async listProjects() {
    try {
      const result = await this.db.pool.query(`
        SELECT 
          name,
          display_name,
          description,
          is_active
        FROM projects 
        WHERE is_active = true
        ORDER BY display_name
      `);

      return result.rows;
    } catch (error) {
      console.error('Failed to list projects:', error.message);
      return [];
    }
  }

  /**
   * Initialize project context on startup
   */
  async initializeContext(workingDirectory = process.cwd(), sessionId = 'default') {
    const detectedProject = await this.autoDetectProject(workingDirectory);
    
    if (detectedProject) {
      await this.setProjectContext(detectedProject, sessionId);
      console.log(`🎯 Project context auto-detected: ${detectedProject}`);
      return detectedProject;
    } else {
      console.log('🤷 No project context detected - use switch_project_context to set manually');
      return null;
    }
  }

  /**
   * Get context summary for display
   */
  async getContextSummary(sessionId = 'default') {
    const currentProject = this.getCurrentProject(sessionId);
    
    if (!currentProject) {
      return {
        hasContext: false,
        message: 'No project context set',
        availableProjects: await this.listProjects()
      };
    }

    const projectInfo = await this.getProjectInfo(currentProject);
    const spokesperson = await this.getProjectSpokesperson(currentProject);

    return {
      hasContext: true,
      currentProject: currentProject,
      projectInfo: projectInfo,
      spokesperson: spokesperson,
      availableProjects: await this.listProjects()
    };
  }
}
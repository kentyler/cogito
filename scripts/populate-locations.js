#!/usr/bin/env node

/**
 * Populate initial file locations in the database
 */

import { DatabaseManager } from '../lib/database.js';
import { LocationManager } from '../lib/location-manager.js';

const config = {
  host: 'localhost',
  port: 5432,
  database: 'cogito_multi',
  user: 'ken',
  password: '7297'
};

const initialLocations = [
  // Email responder
  {
    file_path: '/home/ken/claude-projects/email-responder/check-and-respond.js',
    description: 'Automated email checker and responder script that prompts Claude to check and respond to whitelisted senders',
    project: 'email-responder',
    category: 'script',
    tags: 'automation,email,cron,gmail'
  },
  {
    file_path: '/home/ken/claude-projects/email-responder/setup-cron.sh',
    description: 'Shell script to set up cron job for hourly email checking',
    project: 'email-responder',
    category: 'script',
    tags: 'cron,automation,setup'
  },
  
  // Cogito core
  {
    file_path: '/home/ken/claude-projects/cogito/server.js',
    description: 'Main Cogito MCP server with multi-personality coordination and evaporating cloud conflict resolution',
    project: 'cogito',
    category: 'server',
    tags: 'mcp,server,personality,coordination'
  },
  {
    file_path: '/home/ken/claude-projects/cogito/lib/database.js',
    description: 'PostgreSQL database manager for Cogito system - handles personalities, interactions, thinking processes',
    project: 'cogito',
    category: 'lib',
    tags: 'database,postgres,persistence'
  },
  {
    file_path: '/home/ken/claude-projects/cogito/lib/location-manager.js',
    description: 'Location manager for tracking file paths and descriptions for quick lookup',
    project: 'cogito',
    category: 'lib',
    tags: 'locations,search,filesystem'
  },
  {
    file_path: '/home/ken/claude-projects/cogito/lib/spokesperson.js',
    description: 'Spokesperson personality that coordinates multi-personality responses',
    project: 'cogito',
    category: 'lib',
    tags: 'personality,spokesperson,coordination'
  },
  {
    file_path: '/home/ken/claude-projects/cogito/lib/projectContextManager.js',
    description: 'Manages project context switching and project-specific spokesperson activation',
    project: 'cogito',
    category: 'lib',
    tags: 'context,projects,management'
  },
  
  // Gmail MCP - DEPRECATED (replaced by email-responder cron job)
  // {
  //   file_path: '/home/ken/claude-projects/gmail-mcp/server.js',
  //   description: 'Gmail MCP server providing email functionality (list, read, compose)',
  //   project: 'gmail-mcp',
  //   category: 'server',
  //   tags: 'mcp,gmail,email,api'
  // },
  
  // Liminal Explorer
  {
    file_path: '/home/ken/claude-projects/liminal-explorer-mcp/server.js',
    description: 'Liminal Explorer MCP server for exploring unspoken observations and adjacent possibilities',
    project: 'liminal-explorer',
    category: 'server',
    tags: 'mcp,liminal,exploration,consciousness'
  },
  
  // Configuration files
  {
    file_path: '/home/ken/.claude/config.json',
    description: 'Claude Code configuration file with MCP server definitions',
    project: 'claude-config',
    category: 'config',
    tags: 'config,mcp,servers'
  },
  {
    file_path: '/home/ken/claude-projects/CLAUDE.md',
    description: 'Project instructions and session management guidelines for Claude Code',
    project: 'claude-config',
    category: 'docs',
    tags: 'instructions,session,guidelines'
  },
  
  // Migrations
  {
    file_path: '/home/ken/claude-projects/cogito/migrations/003_locations.sql',
    description: 'SQL migration to create locations table for file tracking',
    project: 'cogito',
    category: 'migration',
    tags: 'sql,migration,locations'
  }
];

async function populateLocations() {
  const db = new DatabaseManager(config);
  const locationManager = new LocationManager(db.pool);
  
  await locationManager.initialize();
  
  console.log('🚀 Populating initial locations...\n');
  
  for (const location of initialLocations) {
    try {
      await locationManager.addLocation(location);
      console.log(`✅ Added: ${location.file_path}`);
    } catch (error) {
      console.error(`❌ Error adding ${location.file_path}: ${error.message}`);
    }
  }
  
  // Show stats
  const stats = await locationManager.getStats();
  console.log('\n📊 Location database stats:');
  console.log(`   Total locations: ${stats.total_locations}`);
  console.log(`   Total projects: ${stats.total_projects}`);
  console.log(`   Total categories: ${stats.total_categories}`);
  
  process.exit(0);
}

populateLocations().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
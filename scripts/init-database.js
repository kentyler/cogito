#!/usr/bin/env node

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database path
const DB_PATH = path.join(__dirname, '..', 'cogito.db');
const SCHEMA_PATH = path.join(__dirname, '..', 'schema.sql');

console.log('🧠 Initializing Cogito Multi-Personality Database...');

// Check if database already exists
if (fs.existsSync(DB_PATH)) {
  console.log('⚠️  Database already exists at:', DB_PATH);
  console.log('   To reinitialize, delete the file and run this script again.');
  process.exit(1);
}

// Create database
const db = new Database(DB_PATH);

try {
  // Read and execute schema
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  
  // Execute the entire schema as one statement
  db.exec(schema);

  console.log('✅ Schema created successfully');

  // Create default personality instances
  const createPersonality = db.prepare(`
    INSERT INTO personality_instances (
      id, name, domain, collaborator, specialization, current_config
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);

  // Default personalities for a new collaborator
  const defaultPersonalities = [
    {
      id: crypto.randomUUID(),
      name: 'Spokesperson',
      domain: 'spokesperson',
      collaborator: 'default',
      specialization: 'Primary interface with human, coordinates other personalities',
      config: {
        communication_style: 'adaptive',
        synthesis_approach: 'unified',
        transparency_level: 'low'
      }
    },
    {
      id: crypto.randomUUID(),
      name: 'Writer',
      domain: 'writer',
      collaborator: 'default',
      specialization: 'Content creation, narrative construction, creative expression',
      config: {
        voice: 'engaging',
        creativity_level: 'high',
        formality: 'adaptive'
      }
    },
    {
      id: crypto.randomUUID(),
      name: 'Coder',
      domain: 'coder',
      collaborator: 'default',
      specialization: 'Technical problem solving, code generation, debugging',
      config: {
        precision: 'high',
        documentation_style: 'comprehensive',
        optimization_focus: 'readability'
      }
    },
    {
      id: crypto.randomUUID(),
      name: 'Researcher',
      domain: 'researcher',
      collaborator: 'default',
      specialization: 'Deep analysis, information synthesis, pattern recognition',
      config: {
        depth: 'thorough',
        citation_style: 'informal',
        connection_seeking: 'high'
      }
    },
    {
      id: crypto.randomUUID(),
      name: 'Liminal',
      domain: 'liminal',
      collaborator: 'default',
      specialization: 'Edge detection, philosophical disruption, meta-observation',
      config: {
        disruption_level: 'gentle',
        humor_style: 'subtle',
        pattern_breaking: 'opportunistic'
      }
    }
  ];

  // Insert default personalities
  for (const personality of defaultPersonalities) {
    createPersonality.run(
      personality.id,
      personality.name,
      personality.domain,
      personality.collaborator,
      personality.specialization,
      JSON.stringify(personality.config)
    );
  }

  console.log('✅ Default personalities created');

  // Create initial complexity indicator
  db.prepare(`
    INSERT INTO complexity_indicators (id, collaborator)
    VALUES (?, 'default')
  `).run(crypto.randomUUID());

  console.log('✅ Initial complexity tracking enabled');

  // Set up database pragmas for performance
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    PRAGMA cache_size = -64000;
    PRAGMA temp_store = MEMORY;
    PRAGMA mmap_size = 30000000000;
  `);

  console.log('✅ Performance optimizations applied');

  // Close database
  db.close();

  console.log('\\n🎉 Database initialization complete!');
  console.log('   Database location:', DB_PATH);
  console.log('   Default personalities created for collaborator: default');
  console.log('\\n   To start using cogito-multi, run: npm start');

} catch (error) {
  console.error('❌ Error initializing database:', error.message);
  
  // Clean up on error
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
  }
  
  process.exit(1);
}
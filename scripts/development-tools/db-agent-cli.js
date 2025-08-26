#!/usr/bin/env node

/**
 * Database Agent CLI - Entry point for modular CLI system
 * 
 * This file provides backward compatibility while delegating to the new modular structure.
 * For new development, use the modular components directly from ./db-cli/
 */

import { DatabaseAgentCLI } from './db-cli/index.js';

// Create and run CLI
const cli = new DatabaseAgentCLI();
cli.run();
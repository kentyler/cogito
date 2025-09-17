#!/usr/bin/env node

/**
 * Migration: Add turn_index field for insertable message ordering
 * This allows messages to be inserted between existing ones
 */

import { DatabaseAgent } from '../database/database-agent.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  const dbAgent = new DatabaseAgent();
  
  try {
    console.log('🚀 Starting turn_index migration...');
    
    // Connect to database
    await dbAgent.connect();
    console.log('✅ Connected to database');
    
    // Read SQL migration file
    const sqlPath = path.join(__dirname, 'add_turn_index_field.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('📄 Loaded migration SQL');
    
    // Run migration
    await dbAgent.connector.query(sql);
    console.log('✅ Migration executed successfully');
    
    // Verify the field was added
    const verifyQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'meetings' 
      AND table_name = 'turns' 
      AND column_name = 'turn_index'
    `;
    
    const result = await dbAgent.connector.query(verifyQuery);
    
    if (result.rows.length > 0) {
      console.log('✅ Verified: turn_index field added successfully');
      console.log('   Data type:', result.rows[0].data_type);
    } else {
      console.error('❌ Warning: turn_index field not found after migration');
    }
    
    // Check how many turns were updated
    const countQuery = `
      SELECT COUNT(*) as total,
             COUNT(turn_index) as with_index
      FROM meetings.turns
    `;
    
    const counts = await dbAgent.connector.query(countQuery);
    console.log(`📊 Stats: ${counts.rows[0].with_index}/${counts.rows[0].total} turns have turn_index set`);
    
    // Test the helper function
    const testQuery = `
      SELECT meetings.calculate_insertion_index(1.0, 2.0) as mid,
             meetings.calculate_insertion_index(NULL, 1.0) as before_first,
             meetings.calculate_insertion_index(10.0, NULL) as after_last
    `;
    
    const testResult = await dbAgent.connector.query(testQuery);
    console.log('🧪 Helper function test:');
    console.log('   Between 1.0 and 2.0:', testResult.rows[0].mid);
    console.log('   Before first:', testResult.rows[0].before_first);
    console.log('   After last:', testResult.rows[0].after_last);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await dbAgent.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration()
    .then(() => {
      console.log('✨ Migration completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}
import fs from 'fs';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.RENDER_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    const migration = fs.readFileSync('./migrations/065_standardize_turns_pk_to_id.sql', 'utf8');
    
    console.log('Running migration 065: Standardize turns.turn_id to id...');
    
    // Check current state before migration
    console.log('\n=== BEFORE MIGRATION ===');
    const beforeResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'meetings' AND table_name = 'turns'
      AND column_name IN ('turn_id', 'id', 'source_turn_id', 'source_id')
      ORDER BY column_name
    `);
    console.table(beforeResult.rows);
    
    await pool.query(migration);
    
    console.log('✅ Migration completed successfully');
    
    // Verify the changes
    console.log('\n=== AFTER MIGRATION ===');
    const afterResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'meetings' AND table_name = 'turns'
      AND column_name IN ('turn_id', 'id', 'source_turn_id', 'source_id')
      ORDER BY column_name
    `);
    console.table(afterResult.rows);
    
    // Check constraints
    console.log('\n=== CONSTRAINTS ===');
    const constraintsResult = await pool.query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_schema = 'meetings' AND table_name = 'turns'
      AND constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY')
    `);
    console.table(constraintsResult.rows);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

runMigration();
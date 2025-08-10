import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.RENDER_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runStepwiseMigration() {
  try {
    console.log('Running stepwise migration 065: Standardize turns.turn_id to id...');
    
    // Step 1: Add new columns
    console.log('\nStep 1: Adding new columns...');
    await pool.query(`
      ALTER TABLE meetings.turns ADD COLUMN IF NOT EXISTS id UUID;
      ALTER TABLE meetings.turns ADD COLUMN IF NOT EXISTS source_id UUID;
    `);
    
    // Step 2: Update id column to match turn_id (in batches to avoid memory issues)
    console.log('Step 2: Populating id column...');
    await pool.query(`UPDATE meetings.turns SET id = turn_id WHERE id IS NULL`);
    
    // Step 3: Update source_id column
    console.log('Step 3: Populating source_id column...');
    await pool.query(`UPDATE meetings.turns SET source_id = source_turn_id WHERE source_turn_id IS NOT NULL AND source_id IS NULL`);
    
    // Step 4: Drop old constraints
    console.log('Step 4: Dropping old constraints...');
    await pool.query(`ALTER TABLE meetings.turns DROP CONSTRAINT IF EXISTS turns_source_turn_id_fkey`);
    await pool.query(`ALTER TABLE meetings.turns DROP CONSTRAINT IF EXISTS turns_pkey`);
    
    // Step 5: Add new constraints
    console.log('Step 5: Adding new constraints...');
    await pool.query(`ALTER TABLE meetings.turns ADD CONSTRAINT turns_pkey PRIMARY KEY (id)`);
    await pool.query(`ALTER TABLE meetings.turns ADD CONSTRAINT turns_source_id_fkey FOREIGN KEY (source_id) REFERENCES meetings.turns(id)`);
    
    // Step 6: Drop old columns
    console.log('Step 6: Dropping old columns...');
    await pool.query(`ALTER TABLE meetings.turns DROP COLUMN IF EXISTS turn_id`);
    await pool.query(`ALTER TABLE meetings.turns DROP COLUMN IF EXISTS source_turn_id`);
    
    console.log('✅ Migration completed successfully');
    
    // Verify the changes
    console.log('\n=== FINAL STATE ===');
    const afterResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'meetings' AND table_name = 'turns'
      AND column_name IN ('turn_id', 'id', 'source_turn_id', 'source_id')
      ORDER BY column_name
    `);
    console.table(afterResult.rows);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

runStepwiseMigration();
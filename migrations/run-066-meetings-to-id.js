import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.RENDER_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrateMeetingsToId() {
  try {
    console.log('Running migration 066: Standardize meetings.meeting_id to id...');
    
    // Step 1: Add new id column to meetings table
    console.log('Step 1: Adding id column to meetings table...');
    await pool.query(`ALTER TABLE meetings.meetings ADD COLUMN IF NOT EXISTS id UUID`);
    await pool.query(`UPDATE meetings.meetings SET id = meeting_id WHERE id IS NULL`);
    
    // Step 2: Add new meeting_id columns to referencing tables
    console.log('Step 2: Adding new FK columns to referencing tables...');
    await pool.query(`ALTER TABLE meetings.meeting_files ADD COLUMN IF NOT EXISTS meeting_ref_id UUID`);
    await pool.query(`ALTER TABLE meetings.turns ADD COLUMN IF NOT EXISTS meeting_ref_id UUID`);
    
    // Step 3: Populate the new FK columns
    console.log('Step 3: Populating new FK columns...');
    await pool.query(`
      UPDATE meetings.meeting_files 
      SET meeting_ref_id = m.id 
      FROM meetings.meetings m 
      WHERE meetings.meeting_files.meeting_id = m.meeting_id 
      AND meetings.meeting_files.meeting_ref_id IS NULL
    `);
    
    await pool.query(`
      UPDATE meetings.turns 
      SET meeting_ref_id = m.id 
      FROM meetings.meetings m 
      WHERE meetings.turns.meeting_id = m.meeting_id 
      AND meetings.turns.meeting_ref_id IS NULL
    `);
    
    // Step 4: Drop old foreign key constraints
    console.log('Step 4: Dropping old constraints...');
    await pool.query(`
      ALTER TABLE meetings.meeting_files 
      DROP CONSTRAINT IF EXISTS meeting_files_meeting_id_fkey
    `);
    await pool.query(`
      ALTER TABLE meetings.turns 
      DROP CONSTRAINT IF EXISTS turns_meeting_id_fkey
    `);
    
    // Step 5: Drop old primary key and create new one
    console.log('Step 5: Updating primary key...');
    await pool.query(`ALTER TABLE meetings.meetings DROP CONSTRAINT meetings_pkey CASCADE`);
    await pool.query(`ALTER TABLE meetings.meetings ADD CONSTRAINT meetings_pkey PRIMARY KEY (id)`);
    
    // Step 6: Add new foreign key constraints
    console.log('Step 6: Adding new FK constraints...');
    await pool.query(`
      ALTER TABLE meetings.meeting_files 
      ADD CONSTRAINT meeting_files_meeting_ref_id_fkey 
      FOREIGN KEY (meeting_ref_id) REFERENCES meetings.meetings(id)
    `);
    await pool.query(`
      ALTER TABLE meetings.turns 
      ADD CONSTRAINT turns_meeting_ref_id_fkey 
      FOREIGN KEY (meeting_ref_id) REFERENCES meetings.meetings(id)
    `);
    
    // Step 7: Drop old columns
    console.log('Step 7: Dropping old columns...');
    await pool.query(`ALTER TABLE meetings.meetings DROP COLUMN meeting_id`);
    await pool.query(`ALTER TABLE meetings.meeting_files DROP COLUMN meeting_id`);
    await pool.query(`ALTER TABLE meetings.turns DROP COLUMN meeting_id`);
    
    // Step 8: Rename the new columns to the standard name
    console.log('Step 8: Renaming columns to standard names...');
    await pool.query(`ALTER TABLE meetings.meeting_files RENAME COLUMN meeting_ref_id TO meeting_id`);
    await pool.query(`ALTER TABLE meetings.turns RENAME COLUMN meeting_ref_id TO meeting_id`);
    
    console.log('✅ Migration completed successfully');
    
    // Verify the changes
    console.log('\n=== VERIFICATION ===');
    const meetingsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'meetings' AND table_name = 'meetings'
      AND column_name IN ('meeting_id', 'id')
      ORDER BY column_name
    `);
    console.log('meetings table columns:');
    console.table(meetingsResult.rows);
    
    const constraintsResult = await pool.query(`
      SELECT constraint_name, table_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_schema = 'meetings' 
      AND table_name IN ('meetings', 'turns', 'meeting_files')
      AND constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY')
      ORDER BY table_name, constraint_name
    `);
    console.log('\nConstraints:');
    console.table(constraintsResult.rows);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

migrateMeetingsToId();
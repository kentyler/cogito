-- Standardize turns.turn_id to id
-- Phase 1: Add new id column and populate it

BEGIN;

-- Add new id column (will auto-populate with UUIDs)
ALTER TABLE meetings.turns ADD COLUMN id UUID DEFAULT gen_random_uuid();

-- Update the id column to match existing turn_id values to maintain consistency
UPDATE meetings.turns SET id = turn_id;

-- Add new source_id column for the self-reference
ALTER TABLE meetings.turns ADD COLUMN source_id UUID;

-- Populate source_id from existing source_turn_id
UPDATE meetings.turns SET source_id = source_turn_id WHERE source_turn_id IS NOT NULL;

-- Drop old foreign key constraint
ALTER TABLE meetings.turns DROP CONSTRAINT IF EXISTS turns_source_turn_id_fkey;

-- Drop old primary key constraint
ALTER TABLE meetings.turns DROP CONSTRAINT turns_pkey;

-- Make new id column the primary key
ALTER TABLE meetings.turns ADD CONSTRAINT turns_pkey PRIMARY KEY (id);

-- Add new foreign key constraint for self-reference
ALTER TABLE meetings.turns ADD CONSTRAINT turns_source_id_fkey 
    FOREIGN KEY (source_id) REFERENCES meetings.turns(id);

-- Drop old columns
ALTER TABLE meetings.turns DROP COLUMN turn_id;
ALTER TABLE meetings.turns DROP COLUMN source_turn_id;

COMMIT;

-- Add comments for clarity
COMMENT ON COLUMN meetings.turns.id IS 'Primary key - standardized from turn_id';
COMMENT ON COLUMN meetings.turns.source_id IS 'Self-reference to parent turn - standardized from source_turn_id';
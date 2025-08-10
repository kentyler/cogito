-- Migration: Consolidate blocks and block_meetings into unified meetings table
-- This migration combines the two tables to simplify the meeting-centric architecture

BEGIN;

-- Step 1: Create the new unified meetings table
CREATE TABLE IF NOT EXISTS conversation.meetings (
    -- Primary key (using UUID from blocks)
    meeting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core meeting information (from blocks)
    name VARCHAR(255) NOT NULL,
    description TEXT,
    meeting_type VARCHAR(50) DEFAULT 'session', -- renamed from block_type
    metadata JSONB DEFAULT '{}',
    created_by_user_id BIGINT REFERENCES client_mgmt.users(id),
    client_id INTEGER REFERENCES client_mgmt.clients(id),
    
    -- Meeting-specific fields (from block_meetings) - nullable for non-video meetings
    recall_bot_id TEXT UNIQUE,
    meeting_url TEXT,
    invited_by_user_id BIGINT REFERENCES client_mgmt.users(id),
    transcript_email VARCHAR(255),
    status TEXT DEFAULT 'joining',
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    published_transcript TEXT,
    full_transcript JSONB,
    full_transcript_embedding VECTOR,
    email_sent BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Step 2: Create indexes for performance
CREATE INDEX idx_meetings_meeting_type ON conversation.meetings(meeting_type);
CREATE INDEX idx_meetings_client_id ON conversation.meetings(client_id);
CREATE INDEX idx_meetings_created_by_user_id ON conversation.meetings(created_by_user_id);
CREATE INDEX idx_meetings_recall_bot_id ON conversation.meetings(recall_bot_id) WHERE recall_bot_id IS NOT NULL;
CREATE INDEX idx_meetings_status ON conversation.meetings(status) WHERE status IS NOT NULL;
CREATE INDEX idx_meetings_created_at ON conversation.meetings(created_at);
CREATE INDEX idx_meetings_updated_at ON conversation.meetings(updated_at);

-- Step 3: Migrate data from existing tables
INSERT INTO conversation.meetings (
    meeting_id,
    name,
    description,
    meeting_type,
    metadata,
    created_by_user_id,
    client_id,
    recall_bot_id,
    meeting_url,
    invited_by_user_id,
    transcript_email,
    status,
    started_at,
    ended_at,
    published_transcript,
    full_transcript,
    full_transcript_embedding,
    email_sent,
    created_at,
    updated_at
)
SELECT 
    b.block_id as meeting_id,
    COALESCE(bm.meeting_name, b.name) as name, -- Prefer meeting_name if available
    b.description,
    b.block_type as meeting_type,
    b.metadata,
    b.created_by_user_id,
    b.client_id,
    bm.recall_bot_id,
    bm.meeting_url,
    bm.invited_by_user_id,
    bm.transcript_email,
    bm.status,
    bm.started_at,
    bm.ended_at,
    NULL as published_transcript, -- This field exists in schema but wasn't in the original block_meetings
    bm.full_transcript,
    bm.full_transcript_embedding,
    bm.email_sent,
    LEAST(b.created_at, bm.created_at) as created_at, -- Use earliest timestamp
    GREATEST(b.updated_at, bm.updated_at) as updated_at -- Use latest timestamp
FROM conversation.blocks b
LEFT JOIN conversation.block_meetings bm ON b.block_id = bm.block_id;

-- Step 4: Handle blocks that don't have corresponding block_meetings entries
-- (These are conversation-type meetings without video/bot components)
-- Note: The LEFT JOIN above should handle this, but let's verify no orphaned blocks exist
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphaned_count
    FROM conversation.blocks b
    LEFT JOIN conversation.meetings m ON b.block_id = m.meeting_id
    WHERE m.meeting_id IS NULL;
    
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Found % orphaned blocks that were not migrated', orphaned_count;
        
        -- Insert any orphaned blocks
        INSERT INTO conversation.meetings (
            meeting_id, name, description, meeting_type, metadata, 
            created_by_user_id, client_id, created_at, updated_at
        )
        SELECT 
            b.block_id, b.name, b.description, b.block_type, b.metadata,
            b.created_by_user_id, b.client_id, b.created_at, b.updated_at
        FROM conversation.blocks b
        LEFT JOIN conversation.meetings m ON b.block_id = m.meeting_id
        WHERE m.meeting_id IS NULL;
    END IF;
END $$;

-- Step 5: Update the turns table to reference meetings instead of blocks
-- First, add the new meeting_id column (nullable initially)
ALTER TABLE conversation.turns ADD COLUMN meeting_id UUID REFERENCES conversation.meetings(meeting_id);

-- Populate the new meeting_id column with existing block_id values
UPDATE conversation.turns SET meeting_id = block_id WHERE block_id IS NOT NULL;

-- Verify all turns have been migrated
DO $$
DECLARE
    unmigrated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO unmigrated_count
    FROM conversation.turns
    WHERE block_id IS NOT NULL AND meeting_id IS NULL;
    
    IF unmigrated_count > 0 THEN
        RAISE EXCEPTION 'Failed to migrate % turns from block_id to meeting_id', unmigrated_count;
    END IF;
    
    RAISE NOTICE 'Successfully migrated all turns to use meeting_id';
END $$;

-- Step 6: Create indexes on the new meeting_id column
CREATE INDEX idx_turns_meeting_id ON conversation.turns(meeting_id);

-- Step 7: Update any other tables that reference blocks
-- Check for block_meeting_files table and update it
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'conversation' AND table_name = 'block_meeting_files') THEN
        -- Add meeting_id column
        ALTER TABLE conversation.block_meeting_files ADD COLUMN meeting_id UUID REFERENCES conversation.meetings(meeting_id);
        
        -- Populate meeting_id from block_meeting_id via block_meetings
        UPDATE conversation.block_meeting_files bmf
        SET meeting_id = bm.block_id
        FROM conversation.block_meetings bm
        WHERE bmf.block_meeting_id = bm.id;
        
        -- Create index
        CREATE INDEX idx_block_meeting_files_meeting_id ON conversation.block_meeting_files(meeting_id);
        
        RAISE NOTICE 'Updated block_meeting_files table with meeting_id references';
    END IF;
END $$;

-- Step 8: Record migration metadata
INSERT INTO conversation.meetings (
    name,
    description, 
    meeting_type,
    metadata,
    created_at,
    updated_at
) VALUES (
    'Schema Migration Record',
    'Migration 050: Consolidated blocks and block_meetings into meetings table',
    'system',
    jsonb_build_object(
        'migration_id', '050',
        'migration_date', NOW()::text,
        'tables_consolidated', ARRAY['blocks', 'block_meetings'],
        'records_migrated', (SELECT COUNT(*) FROM conversation.meetings WHERE meeting_type != 'system')
    ),
    NOW(),
    NOW()
);

COMMIT;

-- Note: The actual dropping of old tables and constraints should be done in a separate migration
-- after verifying the migration was successful and all applications have been updated
-- to use the new meetings table.
-- Add missing columns to conversation.block_meetings table
-- This migration adds an id column (primary key) and meeting_name column

-- First, add the id column as a serial primary key
ALTER TABLE conversation.block_meetings 
ADD COLUMN id SERIAL PRIMARY KEY;

-- Add meeting_name column
ALTER TABLE conversation.block_meetings 
ADD COLUMN meeting_name VARCHAR(255);

-- Update existing records to have a meeting name based on the URL
UPDATE conversation.block_meetings 
SET meeting_name = CASE 
    WHEN meeting_url LIKE '%meet.google.com%' THEN 'Google Meet'
    WHEN meeting_url LIKE '%zoom.us%' THEN 'Zoom Meeting'
    WHEN meeting_url LIKE '%teams.microsoft.com%' THEN 'Microsoft Teams'
    ELSE 'Meeting'
END
WHERE meeting_name IS NULL;

-- Add created_at and updated_at if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'conversation' AND table_name = 'block_meetings' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE conversation.block_meetings ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'conversation' AND table_name = 'block_meetings' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE conversation.block_meetings ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

-- Update existing records to have timestamps
UPDATE conversation.block_meetings 
SET created_at = NOW(), updated_at = NOW()
WHERE created_at IS NULL OR updated_at IS NULL;
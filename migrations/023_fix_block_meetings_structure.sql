-- Fix conversation.block_meetings table structure
-- Add id column and fix primary key

-- First, let's see the current structure
\d conversation.block_meetings;

-- Drop the existing primary key constraint
ALTER TABLE conversation.block_meetings 
DROP CONSTRAINT IF EXISTS block_meetings_pkey;

-- Add the id column as serial (auto-incrementing)
ALTER TABLE conversation.block_meetings 
ADD COLUMN id SERIAL;

-- Add the proper primary key on the id column
ALTER TABLE conversation.block_meetings 
ADD CONSTRAINT block_meetings_pkey PRIMARY KEY (id);

-- Show the updated structure
\d conversation.block_meetings;
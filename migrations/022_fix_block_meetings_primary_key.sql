-- Fix primary key on conversation.block_meetings table
-- Remove the current primary key and add it to the id column

-- First, let's check what the current primary key is
SELECT constraint_name, column_name 
FROM information_schema.key_column_usage 
WHERE table_schema = 'conversation' 
  AND table_name = 'block_meetings' 
  AND constraint_name LIKE '%pkey%';

-- Drop the existing primary key constraint
ALTER TABLE conversation.block_meetings 
DROP CONSTRAINT IF EXISTS block_meetings_pkey;

-- Add the proper primary key on the id column
ALTER TABLE conversation.block_meetings 
ADD CONSTRAINT block_meetings_pkey PRIMARY KEY (id);
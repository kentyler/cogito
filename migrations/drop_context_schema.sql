-- Drop Context Schema Migration
-- 
-- This migration removes the context schema entirely, as we have migrated 
-- to the unified turn embeddings system in meetings.turn_embeddings
-- 
-- Files are now stored as turns with source_type='file_upload'
-- File chunks are now stored as turn embeddings linked to file turns
--
-- Migration was prepared after successfully migrating:
-- - 17 files from context.files to meetings.turns as file_upload turns
-- - 84 file chunks from context.chunks to meetings.turn_embeddings
-- - Updated all code references to use the new turn-based system
--
-- IMPORTANT: This migration should only be run after verifying:
-- 1. All file data has been migrated to turns
-- 2. All chunk data has been migrated to turn_embeddings 
-- 3. All application code has been updated to use the new system
-- 4. The application is working correctly without the context schema

-- Drop the context schema and all its tables
DROP SCHEMA IF EXISTS context CASCADE;

-- Optional: Clean up any remaining references in meetings.meeting_files if needed
-- This table was used to link meetings to files, but under the new system
-- files are just turns directly associated with meetings via meeting_id
-- DELETE FROM meetings.meeting_files; -- Keep table structure for now in case of rollback needs
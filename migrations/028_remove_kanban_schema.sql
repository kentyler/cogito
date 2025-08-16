-- Remove entire kanban schema and all its tables
-- Migration: 028_remove_kanban_schema.sql
-- The kanban functionality was a separate web app that is no longer used

-- Drop the entire kanban schema (CASCADE removes all tables and dependencies)
DROP SCHEMA IF EXISTS kanban CASCADE;

-- Add comment about removal
COMMENT ON DATABASE cogitomeetingsdev IS 'Kanban schema removed as part of cleanup - was separate unused application';
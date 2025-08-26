-- Create games schema and move client_games table
-- Groups design game functionality in its own schema

-- Create the games schema
CREATE SCHEMA IF NOT EXISTS games;

-- Move client_games table from public to games schema
ALTER TABLE public.client_games SET SCHEMA games;

-- Update indexes to reflect the schema change
-- (PostgreSQL automatically moves indexes with the table)

COMMENT ON SCHEMA games IS 'Design games and card libraries functionality';
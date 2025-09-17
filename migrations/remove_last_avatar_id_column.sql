-- Migration: Remove last_avatar_id column from client_mgmt.users
-- Date: 2025-01-10
-- Reason: Column is no longer used in the system

ALTER TABLE client_mgmt.users 
DROP COLUMN IF EXISTS last_avatar_id;
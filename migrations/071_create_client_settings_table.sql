-- Migration: Create client_settings table for client-specific configuration
-- This table stores per-client settings like temperature, that override site defaults

BEGIN;

-- Create client_settings table
CREATE TABLE IF NOT EXISTS client_mgmt.client_settings (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL REFERENCES client_mgmt.clients(id) ON DELETE CASCADE,
    setting_key VARCHAR(50) NOT NULL,
    setting_value TEXT NOT NULL,
    setting_type VARCHAR(20) DEFAULT 'string' CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by_user_id BIGINT REFERENCES client_mgmt.users(id) ON DELETE SET NULL,
    
    -- Unique constraint to prevent duplicate settings for same client
    UNIQUE(client_id, setting_key)
);

-- Create indexes for performance
CREATE INDEX idx_client_settings_client_id ON client_mgmt.client_settings(client_id);
CREATE INDEX idx_client_settings_key ON client_mgmt.client_settings(setting_key);
CREATE INDEX idx_client_settings_client_key ON client_mgmt.client_settings(client_id, setting_key);

-- Add comments for documentation
COMMENT ON TABLE client_mgmt.client_settings IS 'Client-specific configuration settings that override site defaults';
COMMENT ON COLUMN client_mgmt.client_settings.setting_key IS 'The configuration key (e.g., temperature, max_tokens)';
COMMENT ON COLUMN client_mgmt.client_settings.setting_value IS 'The configuration value stored as text';
COMMENT ON COLUMN client_mgmt.client_settings.setting_type IS 'Data type hint for parsing the value';

-- Insert default temperature setting for existing clients if needed
INSERT INTO client_mgmt.client_settings (client_id, setting_key, setting_value, setting_type)
SELECT 
    id, 
    'temperature', 
    '0.7', 
    'number'
FROM client_mgmt.clients
WHERE id NOT IN (
    SELECT client_id 
    FROM client_mgmt.client_settings 
    WHERE setting_key = 'temperature'
);

-- Log the migration
DO $$
BEGIN
    RAISE NOTICE 'Client settings table created with temperature defaults for existing clients';
END $$;

COMMIT;
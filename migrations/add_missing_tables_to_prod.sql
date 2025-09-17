-- Migration: Add missing tables to production database
-- Date: 2025-09-03
-- Description: Creates tables that exist in dev but not in prod

BEGIN;

-- 1. Create client_mgmt.client_settings table
CREATE TABLE IF NOT EXISTS client_mgmt.client_settings (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL,
    setting_key VARCHAR(50) NOT NULL,
    setting_value TEXT NOT NULL,
    setting_type VARCHAR(20) DEFAULT 'string',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by_user_id BIGINT,
    CONSTRAINT client_settings_client_id_setting_key_key UNIQUE (client_id, setting_key),
    CONSTRAINT client_settings_setting_type_check CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
    CONSTRAINT client_settings_client_id_fkey FOREIGN KEY (client_id) 
        REFERENCES client_mgmt.clients(id) ON DELETE CASCADE,
    CONSTRAINT client_settings_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) 
        REFERENCES client_mgmt.users(id) ON DELETE SET NULL
);

-- Create indexes for client_settings
CREATE INDEX IF NOT EXISTS idx_client_settings_client_id ON client_mgmt.client_settings(client_id);
CREATE INDEX IF NOT EXISTS idx_client_settings_client_key ON client_mgmt.client_settings(client_id, setting_key);
CREATE INDEX IF NOT EXISTS idx_client_settings_key ON client_mgmt.client_settings(setting_key);

-- 2. Create client_mgmt.llm_models table
CREATE TABLE IF NOT EXISTS client_mgmt.llm_models (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    model_id VARCHAR(255) NOT NULL UNIQUE,
    llm_id INTEGER NOT NULL,
    input_cost_per_token NUMERIC(10,8) DEFAULT 0,
    output_cost_per_token NUMERIC(10,8) DEFAULT 0,
    cost_per_1k_tokens NUMERIC(10,6) DEFAULT 0,
    max_tokens INTEGER DEFAULT 4000,
    temperature NUMERIC(3,2) DEFAULT 0.7,
    supports_streaming BOOLEAN DEFAULT true,
    supports_images BOOLEAN DEFAULT false,
    supports_functions BOOLEAN DEFAULT false,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT llm_models_llm_id_fkey FOREIGN KEY (llm_id) 
        REFERENCES client_mgmt.llms(id) ON DELETE CASCADE
);

-- Create indexes for llm_models
CREATE INDEX IF NOT EXISTS idx_llm_models_active ON client_mgmt.llm_models(is_active);
CREATE INDEX IF NOT EXISTS idx_llm_models_llm_id ON client_mgmt.llm_models(llm_id);
CREATE INDEX IF NOT EXISTS idx_llm_models_model_id ON client_mgmt.llm_models(model_id);

-- 3. Create client_mgmt.user_avatar_preferences table
CREATE TABLE IF NOT EXISTS client_mgmt.user_avatar_preferences (
    user_id INTEGER NOT NULL,
    avatar_id VARCHAR NOT NULL,
    context VARCHAR NOT NULL DEFAULT 'general',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, avatar_id, context),
    CONSTRAINT user_avatar_preferences_user_id_fkey FOREIGN KEY (user_id) 
        REFERENCES client_mgmt.users(id) ON DELETE CASCADE,
    CONSTRAINT user_avatar_preferences_avatar_id_fkey FOREIGN KEY (avatar_id) 
        REFERENCES client_mgmt.avatars(id) ON DELETE CASCADE
);

-- Create index for user_avatar_preferences
CREATE INDEX IF NOT EXISTS idx_user_avatar_prefs_user ON client_mgmt.user_avatar_preferences(user_id);

-- 4. Check if games.cards table needs the trigger function first
CREATE OR REPLACE FUNCTION games.update_cards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create games.cards table
CREATE TABLE IF NOT EXISTS games.cards (
    id SERIAL PRIMARY KEY,
    game_id UUID NOT NULL,
    parent_card_id INTEGER,
    name VARCHAR(255) NOT NULL,
    pattern TEXT,
    forces TEXT,
    resolution TEXT,
    status VARCHAR(50) DEFAULT '',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    CONSTRAINT cards_game_id_name_key UNIQUE (game_id, name),
    CONSTRAINT cards_game_id_fkey FOREIGN KEY (game_id) 
        REFERENCES games.client_games(id) ON DELETE CASCADE,
    CONSTRAINT cards_parent_card_id_fkey FOREIGN KEY (parent_card_id) 
        REFERENCES games.cards(id) ON DELETE CASCADE
);

-- Create indexes for cards
CREATE INDEX IF NOT EXISTS idx_cards_game_id ON games.cards(game_id);
CREATE INDEX IF NOT EXISTS idx_cards_parent_card_id ON games.cards(parent_card_id);

-- Create trigger for cards
CREATE TRIGGER update_cards_updated_at 
    BEFORE UPDATE ON games.cards 
    FOR EACH ROW 
    EXECUTE FUNCTION games.update_cards_updated_at();

-- 6. Also fix the column type differences in client_mgmt.users if needed
-- Note: These ALTER statements will only run if the columns exist with wrong types
DO $$ 
BEGIN
    -- Check and alter last_avatar_id if it exists as varchar
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'client_mgmt' 
        AND table_name = 'users' 
        AND column_name = 'last_avatar_id'
        AND data_type = 'character varying'
    ) THEN
        -- First drop the column and recreate it as integer
        -- This is safer than trying to cast
        ALTER TABLE client_mgmt.users DROP COLUMN IF EXISTS last_avatar_id;
        ALTER TABLE client_mgmt.users ADD COLUMN last_avatar_id INTEGER;
    END IF;

    -- Check and alter last_client_id if it exists as bigint
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'client_mgmt' 
        AND table_name = 'users' 
        AND column_name = 'last_client_id'
        AND data_type = 'bigint'
    ) THEN
        -- Convert bigint to integer (safe since client IDs are small)
        ALTER TABLE client_mgmt.users 
        ALTER COLUMN last_client_id TYPE INTEGER USING last_client_id::INTEGER;
    END IF;
END $$;

COMMIT;

-- Verification query (run separately to check):
-- SELECT 
--     'client_settings' as table_name, 
--     EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='client_mgmt' AND table_name='client_settings') as exists
-- UNION ALL
-- SELECT 
--     'llm_models', 
--     EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='client_mgmt' AND table_name='llm_models')
-- UNION ALL
-- SELECT 
--     'user_avatar_preferences', 
--     EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='client_mgmt' AND table_name='user_avatar_preferences')
-- UNION ALL
-- SELECT 
--     'cards', 
--     EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='games' AND table_name='cards');
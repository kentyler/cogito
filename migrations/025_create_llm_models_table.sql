-- Create llm_models table to store model information and usage costs
-- Migration: 025_create_llm_models_table.sql

CREATE TABLE IF NOT EXISTS client_mgmt.llm_models (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    model_id VARCHAR(255) NOT NULL UNIQUE, -- e.g., 'claude-3-5-sonnet-20241022', 'gpt-4o'
    llm_id INTEGER NOT NULL REFERENCES client_mgmt.llms(id) ON DELETE CASCADE,
    
    -- Cost information for usage calculation
    input_cost_per_token DECIMAL(10, 8) DEFAULT 0, -- Cost per input token
    output_cost_per_token DECIMAL(10, 8) DEFAULT 0, -- Cost per output token
    cost_per_1k_tokens DECIMAL(10, 6) DEFAULT 0, -- Alternative pricing model
    
    -- Model configuration
    max_tokens INTEGER DEFAULT 4000,
    temperature DECIMAL(3, 2) DEFAULT 0.7,
    supports_streaming BOOLEAN DEFAULT true,
    supports_images BOOLEAN DEFAULT false,
    supports_functions BOOLEAN DEFAULT false,
    
    -- Metadata
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_llm_models_llm_id ON client_mgmt.llm_models(llm_id);
CREATE INDEX IF NOT EXISTS idx_llm_models_model_id ON client_mgmt.llm_models(model_id);
CREATE INDEX IF NOT EXISTS idx_llm_models_active ON client_mgmt.llm_models(is_active);

-- Add comment
COMMENT ON TABLE client_mgmt.llm_models IS 'Individual model configurations with cost and capability information';
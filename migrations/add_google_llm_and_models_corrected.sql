-- Migration: Add Google LLM provider and insert all llm_models data (corrected)
-- Date: 2025-09-03
-- Description: Add missing Google LLM provider and insert llm_models data with correct column names

BEGIN;

-- First, add the missing Google LLM provider
INSERT INTO client_mgmt.llms (id, provider, api_key, additional_config, subdomain, created_at, updated_at)
VALUES (4, 'google', '', NULL, 'public', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Clear any existing llm_models data (if any) to avoid conflicts
DELETE FROM client_mgmt.llm_models;

-- Reset sequence to start from 1
ALTER SEQUENCE client_mgmt.llm_models_id_seq RESTART WITH 1;

-- Insert llm_models data from development
INSERT INTO client_mgmt.llm_models (id, name, model_id, llm_id, input_cost_per_token, output_cost_per_token, cost_per_1k_tokens, max_tokens, temperature, supports_streaming, supports_images, supports_functions, description, is_active, created_at, updated_at) VALUES 
(1, 'Claude 3.5 Sonnet', 'claude-3-5-sonnet-20241022', 1, 0.00000300, 0.00001500, 0.000000, 4000, 0.70, true, true, true, 'Anthropic latest high-performance model with vision and function calling', true, '2025-08-16 00:58:43.353138+00'::timestamptz, '2025-08-16 00:58:43.353138+00'::timestamptz),
(2, 'GPT-4 Turbo', 'gpt-4-turbo', 2, 0.00001000, 0.00003000, 0.000000, 4000, 0.70, true, true, true, 'OpenAI faster version of GPT-4 with vision and function calling', true, '2025-08-16 00:58:43.406342+00'::timestamptz, '2025-08-16 00:58:43.406342+00'::timestamptz),
(3, 'GPT-4o', 'gpt-4o', 2, 0.00000500, 0.00001500, 0.000000, 4000, 0.70, true, true, true, 'OpenAI latest multimodal model with vision and function calling', true, '2025-08-16 00:58:43.452392+00'::timestamptz, '2025-08-16 00:58:43.452392+00'::timestamptz),
(4, 'Gemini Pro', 'gemini-pro', 4, 0.00000050, 0.00000150, 0.000000, 4000, 0.70, true, true, true, 'Google multimodal model with vision and function calling', true, '2025-08-16 00:58:43.494676+00'::timestamptz, '2025-08-16 00:58:43.494676+00'::timestamptz),
(5, 'Claude 3 Haiku', 'claude-3-haiku-20240307', 1, 0.00000025, 0.00000125, 0.000000, 4000, 0.70, true, false, true, 'Anthropic fastest model, good for simple tasks', true, '2025-08-16 00:58:43.536854+00'::timestamptz, '2025-08-16 00:58:43.536854+00'::timestamptz);

-- Update sequence to current max value + 1
SELECT setval('client_mgmt.llm_models_id_seq', (SELECT MAX(id) FROM client_mgmt.llm_models) + 1);

COMMIT;

-- Verification queries
SELECT 'LLM Providers:' as section;
SELECT id, provider FROM client_mgmt.llms ORDER BY id;

SELECT 'LLM Models:' as section;
SELECT id, name, model_id, llm_id, is_active FROM client_mgmt.llm_models ORDER BY id;
-- Add user-level temperature preference to client_mgmt.users table
-- This moves temperature from client-level to user-level for better UX

-- Add the temperature column with a default of 0.7
ALTER TABLE client_mgmt.users 
ADD COLUMN last_temperature DECIMAL(3,2) DEFAULT 0.7 CHECK (last_temperature >= 0.0 AND last_temperature <= 1.0);

-- Add comment for documentation
COMMENT ON COLUMN client_mgmt.users.last_temperature IS 'User preferred temperature setting for LLM conversations (0.0-1.0)';

-- Optional: Migrate existing client-level temperature settings to user-level
-- This finds users who have set temperature in client_settings and copies their most recent setting
UPDATE client_mgmt.users 
SET last_temperature = subquery.setting_value::DECIMAL(3,2)
FROM (
    SELECT DISTINCT ON (uc.user_id) 
        uc.user_id,
        cs.setting_value,
        cs.updated_at
    FROM client_mgmt.user_clients uc
    JOIN client_mgmt.client_settings cs ON cs.client_id = uc.client_id
    WHERE cs.setting_key = 'temperature'
    AND cs.setting_type = 'number'
    ORDER BY uc.user_id, cs.updated_at DESC
) subquery
WHERE client_mgmt.users.id = subquery.user_id;
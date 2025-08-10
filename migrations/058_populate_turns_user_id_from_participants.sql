-- Migration: Populate turns.user_id based on participant-user email correlation
-- This bridges the gap between the participant-centric and user-centric approaches
-- by correlating participants with users via email addresses

BEGIN;

-- Update turns to set user_id where participant email matches user email
UPDATE conversation.turns 
SET user_id = u.id
FROM conversation.participants p
JOIN client_mgmt.users u ON p.email = u.email
WHERE conversation.turns.participant_id = p.id
  AND conversation.turns.user_id IS NULL;

-- Log the results for verification
DO $$
DECLARE
    updated_count INTEGER;
    total_turns INTEGER;
    with_user_id INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_turns FROM conversation.turns;
    SELECT COUNT(*) INTO with_user_id FROM conversation.turns WHERE user_id IS NOT NULL;
    
    RAISE NOTICE 'Migration complete: % of % turns now have user_id populated', with_user_id, total_turns;
END $$;

COMMIT;
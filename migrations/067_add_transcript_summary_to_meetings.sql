-- Add transcript_summary field to meetings table
-- Purpose: Store brief summaries to help identify meetings with non-descriptive titles

ALTER TABLE meetings.meetings 
ADD COLUMN IF NOT EXISTS transcript_summary TEXT;

-- Add comment explaining the field's purpose
COMMENT ON COLUMN meetings.meetings.transcript_summary IS 'Brief summary/blurb of the transcript content to help identify meetings, especially those with generic titles';

-- Create an index on the summary for text search if needed
CREATE INDEX IF NOT EXISTS idx_meetings_transcript_summary 
ON meetings.meetings 
USING gin(to_tsvector('english', transcript_summary))
WHERE transcript_summary IS NOT NULL;
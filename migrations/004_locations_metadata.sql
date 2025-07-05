-- Add metadata field to locations table for storing structured information
ALTER TABLE locations ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Update existing embedding entries with structured metadata
UPDATE locations 
SET metadata = jsonb_build_object(
    'model', 'all-MiniLM-L6-v2',
    'environment', '/home/ken/claude-projects/cogito/embedding_env',
    'purpose', 'Process session notes and essays to generate embeddings for discourse enrichment',
    'usage', jsonb_build_array(
        'python daily_embeddings.py - processes both sessions and essays',
        'python daily_embeddings.py --sessions [dir] - just session notes',
        'python daily_embeddings.py --essays [dir] - just essays'
    )
)
WHERE file_path = '/home/ken/claude-projects/cogito/daily_embeddings.py';

-- Example of how to query metadata
-- SELECT file_path, metadata->>'model' as model FROM locations WHERE metadata IS NOT NULL;
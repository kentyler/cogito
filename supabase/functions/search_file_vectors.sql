-- Create RPC function for vector similarity search
-- This function is used by the file-search edge function

CREATE OR REPLACE FUNCTION search_file_vectors(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  filter_client_id int DEFAULT 6
)
RETURNS TABLE (
  id int,
  file_upload_id int,
  chunk_index int,
  content_text text,
  filename text,
  description text,
  tags text[],
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fv.id,
    fv.file_upload_id,
    fv.chunk_index,
    fv.content_text,
    f.filename,
    f.description,
    f.tags,
    1 - (fv.content_vector <=> query_embedding) as similarity
  FROM file_upload_vectors fv
  JOIN file_uploads f ON f.id = fv.file_upload_id
  WHERE 
    fv.client_id = filter_client_id 
    AND fv.content_vector IS NOT NULL
    AND 1 - (fv.content_vector <=> query_embedding) > match_threshold
  ORDER BY fv.content_vector <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_file_vectors TO authenticated;
GRANT EXECUTE ON FUNCTION search_file_vectors TO service_role;
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query, clientId = 6, limit = 10 } = await req.json()
    
    if (!query) {
      throw new Error('Query parameter is required')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const openaiKey = Deno.env.get('OPENAI_API_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Generate embedding for query
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: query,
        dimensions: 1536,
      }),
    })

    if (!embeddingResponse.ok) {
      throw new Error('Failed to generate query embedding')
    }

    const embeddingData = await embeddingResponse.json()
    const queryEmbedding = embeddingData.data[0].embedding

    // Search using pgvector similarity
    // Note: Using RPC function for vector similarity search
    const { data: searchResults, error: searchError } = await supabase
      .rpc('search_file_vectors', {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: limit,
        filter_client_id: clientId,
      })

    if (searchError) {
      // Fallback to text search if vector search fails
      const { data: textResults, error: textError } = await supabase
        .from('file_upload_vectors')
        .select(`
          id,
          file_upload_id,
          chunk_index,
          content_text,
          file_uploads!inner(
            filename,
            description,
            tags
          )
        `)
        .eq('client_id', clientId)
        .textSearch('content_text', query)
        .limit(limit)

      if (textError) {
        throw new Error(`Search failed: ${textError.message}`)
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: textResults,
          searchType: 'text'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: searchResults,
        searchType: 'vector'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
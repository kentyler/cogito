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
    const { fileId, filePath, mimeType, clientId } = await req.json()
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const openaiKey = Deno.env.get('OPENAI_API_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('files')
      .download(filePath)

    if (downloadError) {
      throw new Error(`Failed to download file: ${downloadError.message}`)
    }

    // Extract text content based on mime type
    let textContent = ''
    
    if (mimeType.startsWith('text/') || mimeType === 'application/json') {
      textContent = await fileData.text()
    } else if (mimeType === 'application/pdf') {
      // PDF processing would require a PDF parsing library
      console.log('PDF processing not implemented')
      return new Response(
        JSON.stringify({ success: true, message: 'PDF processing not implemented' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      return new Response(
        JSON.stringify({ success: true, message: `Unsupported file type: ${mimeType}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!textContent || textContent.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No text content found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Chunk the text
    const chunks = chunkText(textContent, 1000, 200)
    console.log(`Processing ${chunks.length} chunks for file ${fileId}`)

    // Process chunks with embeddings
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      
      // Generate embedding using OpenAI
      let embedding = null
      try {
        const response = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: chunk,
            dimensions: 1536,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          embedding = data.data[0].embedding
        }
      } catch (error) {
        console.error(`Error generating embedding for chunk ${i}:`, error)
      }

      // Insert chunk with vector
      const { error: insertError } = await supabase
        .from('file_upload_vectors')
        .insert({
          file_upload_id: fileId,
          chunk_index: i,
          content_text: chunk,
          content_vector: embedding,
          client_id: clientId,
        })

      if (insertError) {
        console.error(`Error inserting chunk ${i}:`, insertError)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${chunks.length} chunks for file ${fileId}` 
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

function chunkText(text: string, chunkSize = 1000, overlap = 200): string[] {
  const chunks: string[] = []
  let start = 0
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length)
    const chunk = text.slice(start, end)
    
    if (chunk.trim().length > 0) {
      chunks.push(chunk.trim())
    }
    
    start = end - overlap
    if (start <= 0) start = end
  }
  
  return chunks
}
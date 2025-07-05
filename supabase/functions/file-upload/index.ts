import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { multiParser } from 'https://deno.land/x/multiparser@0.114.0/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Create Supabase client with service role key for storage operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse multipart form data
    const form = await multiParser(req)
    if (!form || !form.files || form.files.length === 0) {
      throw new Error('No file uploaded')
    }

    const file = form.files[0]
    const clientId = parseInt(form.fields?.clientId || '6')
    const description = form.fields?.description || null
    const tags = form.fields?.tags ? JSON.parse(form.fields.tags) : null
    const skipVectorization = form.fields?.skipVectorization === 'true'

    // Generate storage path
    const timestamp = Date.now()
    const safeName = file.filename.replace(/[^a-zA-Z0-9_\-\.]/g, '_')
    const storagePath = `uploads/${timestamp}-${safeName}`

    // Upload to Supabase Storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from('files')
      .upload(storagePath, file.content, {
        contentType: file.contentType,
      })

    if (storageError) {
      throw new Error(`Storage upload failed: ${storageError.message}`)
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('files')
      .getPublicUrl(storagePath)

    // Create file upload record
    const { data: fileUpload, error: dbError } = await supabase
      .from('file_uploads')
      .insert({
        filename: file.filename,
        mime_type: file.contentType,
        file_path: storagePath,
        file_size: file.content.byteLength,
        public_url: publicUrl,
        bucket_name: 'files',
        description,
        tags,
        client_id: clientId,
      })
      .select()
      .single()

    if (dbError) {
      // Clean up storage on DB error
      await supabase.storage.from('files').remove([storagePath])
      throw new Error(`Database insert failed: ${dbError.message}`)
    }

    // Start vectorization in background if not skipped
    if (!skipVectorization && fileUpload) {
      // Invoke vectorization edge function
      fetch(`${supabaseUrl}/functions/v1/file-vectorize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId: fileUpload.id,
          filePath: storagePath,
          mimeType: file.contentType,
          clientId,
        }),
      }).catch(error => {
        console.error('Failed to start vectorization:', error)
      })
    }

    return new Response(
      JSON.stringify({ success: true, data: fileUpload }),
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
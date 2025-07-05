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
    const { fileId, clientId = 6 } = await req.json()
    
    if (!fileId) {
      throw new Error('fileId parameter is required')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get file details before deletion
    const { data: fileData, error: fetchError } = await supabase
      .from('file_uploads')
      .select('*')
      .eq('id', fileId)
      .eq('client_id', clientId)
      .single()

    if (fetchError || !fileData) {
      throw new Error('File not found or access denied')
    }

    // Delete from storage
    if (fileData.file_path && fileData.bucket_name) {
      const { error: storageError } = await supabase.storage
        .from(fileData.bucket_name)
        .remove([fileData.file_path])

      if (storageError) {
        console.error('Storage deletion error:', storageError)
        // Continue with database deletion even if storage fails
      }
    }

    // Delete from database (vectors will cascade delete)
    const { error: deleteError } = await supabase
      .from('file_uploads')
      .delete()
      .eq('id', fileId)
      .eq('client_id', clientId)

    if (deleteError) {
      throw new Error(`Failed to delete file record: ${deleteError.message}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `File ${fileId} deleted successfully`,
        deletedFile: fileData
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
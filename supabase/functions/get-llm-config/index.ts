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
    const { entityType, entityId } = await req.json()
    
    if (!entityType || !entityId) {
      throw new Error('entityType and entityId are required')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let result

    switch (entityType) {
      case 'client': {
        // Get client's current LLM configuration
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select(`
            id,
            name,
            current_llm_id,
            llms!current_llm_id (
              id,
              name,
              provider,
              model,
              temperature,
              max_tokens,
              additional_config,
              api_key,
              llm_types (
                id,
                name,
                api_handler
              )
            )
          `)
          .eq('id', entityId)
          .single()

        if (clientError) throw clientError
        
        result = {
          entityType: 'client',
          entityId,
          currentLlm: clientData.llms,
          entityName: clientData.name
        }
        break
      }

      case 'participant': {
        // Get participant's LLM configuration with fallback to client's LLM
        const { data: participantData, error: participantError } = await supabase
          .from('participants')
          .select(`
            id,
            name,
            current_llm_id,
            client_id,
            llms!current_llm_id (
              id,
              name,
              provider,
              model,
              temperature,
              max_tokens,
              additional_config,
              api_key,
              llm_types (
                id,
                name,
                api_handler
              )
            )
          `)
          .eq('id', entityId)
          .single()

        if (participantError) throw participantError

        // If participant has no LLM, get client's LLM
        if (!participantData.current_llm_id) {
          const { data: clientLlm, error: clientLlmError } = await supabase
            .from('clients')
            .select(`
              llms!current_llm_id (
                id,
                name,
                provider,
                model,
                temperature,
                max_tokens,
                additional_config,
                api_key,
                llm_types (
                  id,
                  name,
                  api_handler
                )
              )
            `)
            .eq('id', participantData.client_id)
            .single()

          if (clientLlmError) throw clientLlmError

          result = {
            entityType: 'participant',
            entityId,
            currentLlm: clientLlm.llms,
            entityName: participantData.name,
            isInherited: true,
            inheritedFrom: 'client'
          }
        } else {
          result = {
            entityType: 'participant',
            entityId,
            currentLlm: participantData.llms,
            entityName: participantData.name,
            isInherited: false
          }
        }
        break
      }

      case 'available': {
        // Get all available LLMs for a client
        const clientId = entityId
        
        const { data: llms, error: llmsError } = await supabase
          .from('llms')
          .select(`
            id,
            name,
            provider,
            model,
            temperature,
            max_tokens,
            additional_config,
            llm_types (
              id,
              name,
              api_handler
            )
          `)
          .eq('client_id', clientId)
          .order('name')

        if (llmsError) throw llmsError

        result = {
          entityType: 'available',
          clientId,
          llms
        }
        break
      }

      default:
        throw new Error(`Unknown entity type: ${entityType}`)
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error getting LLM config:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
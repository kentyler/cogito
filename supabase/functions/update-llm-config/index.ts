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
    const { action, data } = await req.json()
    
    if (!action || !data) {
      throw new Error('action and data are required')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let result

    switch (action) {
      case 'set_client_llm': {
        const { clientId, llmId } = data
        
        // Verify the LLM belongs to the client
        const { data: llmCheck, error: llmCheckError } = await supabase
          .from('llms')
          .select('id')
          .eq('id', llmId)
          .eq('client_id', clientId)
          .single()

        if (llmCheckError || !llmCheck) {
          throw new Error('LLM not found or does not belong to this client')
        }

        // Update client's current LLM
        const { data: updated, error: updateError } = await supabase
          .from('clients')
          .update({ current_llm_id: llmId })
          .eq('id', clientId)
          .select()
          .single()

        if (updateError) throw updateError

        // Add to client_llms junction table if not exists
        await supabase
          .from('client_llms')
          .upsert({ client_id: clientId, llm_id: llmId })

        result = { updated: true, client: updated }
        break
      }

      case 'set_participant_llm': {
        const { participantId, llmId } = data
        
        // Get participant's client_id
        const { data: participant, error: participantError } = await supabase
          .from('participants')
          .select('client_id')
          .eq('id', participantId)
          .single()

        if (participantError) throw participantError

        // Verify the LLM belongs to the participant's client
        const { data: llmCheck, error: llmCheckError } = await supabase
          .from('llms')
          .select('id')
          .eq('id', llmId)
          .eq('client_id', participant.client_id)
          .single()

        if (llmCheckError || !llmCheck) {
          throw new Error('LLM not found or does not belong to participant\'s client')
        }

        // Update participant's current LLM
        const { data: updated, error: updateError } = await supabase
          .from('participants')
          .update({ current_llm_id: llmId })
          .eq('id', participantId)
          .select()
          .single()

        if (updateError) throw updateError

        // Add to participant_llms junction table if not exists
        await supabase
          .from('participant_llms')
          .upsert({ 
            participant_id: participantId, 
            llm_id: llmId,
            client_id: participant.client_id
          })

        result = { updated: true, participant: updated }
        break
      }

      case 'clear_participant_llm': {
        // Clear participant's LLM to inherit from client
        const { participantId } = data

        const { data: updated, error: updateError } = await supabase
          .from('participants')
          .update({ current_llm_id: null })
          .eq('id', participantId)
          .select()
          .single()

        if (updateError) throw updateError

        result = { updated: true, participant: updated, willInherit: true }
        break
      }

      case 'create_llm': {
        const { 
          name, 
          provider, 
          model, 
          apiKey, 
          temperature = 0.7, 
          maxTokens = 1000,
          typeId,
          additionalConfig,
          clientId
        } = data

        const { data: newLlm, error: createError } = await supabase
          .from('llms')
          .insert({
            name,
            provider,
            model,
            api_key: apiKey,
            temperature,
            max_tokens: maxTokens,
            type_id: typeId,
            additional_config: additionalConfig,
            client_id: clientId
          })
          .select()
          .single()

        if (createError) throw createError

        result = { created: true, llm: newLlm }
        break
      }

      case 'update_llm': {
        const { llmId, updates, clientId } = data

        // Verify ownership
        const { data: llmCheck, error: llmCheckError } = await supabase
          .from('llms')
          .select('id')
          .eq('id', llmId)
          .eq('client_id', clientId)
          .single()

        if (llmCheckError || !llmCheck) {
          throw new Error('LLM not found or access denied')
        }

        const { data: updated, error: updateError } = await supabase
          .from('llms')
          .update(updates)
          .eq('id', llmId)
          .select()
          .single()

        if (updateError) throw updateError

        result = { updated: true, llm: updated }
        break
      }

      default:
        throw new Error(`Unknown action: ${action}`)
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error updating LLM config:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
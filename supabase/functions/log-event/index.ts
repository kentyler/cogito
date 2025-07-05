import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Event type constants
const EVENT_TYPE = {
  // Conversation events
  PROMPT_SUBMITTED: 1,
  RESPONSE_GENERATED: 2,
  SESSION_STARTED: 3,
  SESSION_ENDED: 4,
  
  // File operation events
  FILE_UPLOADED: 5,
  FILE_PROCESSED: 6,
  FILE_DELETED: 7,
  
  // Search events
  SEMANTIC_SEARCH: 8,
  FILE_SEARCH: 9,
  
  // User action events
  BUTTON_CLICKED: 10,
  CONTEXT_SWITCHED: 11,
  
  // System events
  ERROR_OCCURRED: 12,
  SERVICE_STARTED: 13,
  MAINTENANCE_PERFORMED: 14
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { eventType, eventData } = await req.json()
    
    if (!eventType || !eventData) {
      throw new Error('eventType and eventData are required')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let result

    switch (eventType) {
      case 'conversation_turn': {
        const { participantId, sessionId, interactionType, content } = eventData
        
        const eventTypeId = interactionType === 'human_input' 
          ? EVENT_TYPE.PROMPT_SUBMITTED 
          : EVENT_TYPE.RESPONSE_GENERATED

        const { data, error } = await supabase
          .from('participant_events')
          .insert({
            participant_id: participantId,
            event_type_id: eventTypeId,
            details: {
              sessionId,
              contentPreview: content.substring(0, 100),
              interactionType
            },
            client_id: eventData.clientId || 6
          })
          .select()
          .single()

        if (error) throw error
        result = data
        break
      }

      case 'file_operation': {
        const { participantId, operation, fileId, filename, metadata = {} } = eventData
        
        const eventTypeMap = {
          'upload': EVENT_TYPE.FILE_UPLOADED,
          'process': EVENT_TYPE.FILE_PROCESSED,
          'delete': EVENT_TYPE.FILE_DELETED
        }

        const { data, error } = await supabase
          .from('participant_events')
          .insert({
            participant_id: participantId,
            event_type_id: eventTypeMap[operation],
            details: {
              fileId,
              filename,
              ...metadata
            },
            client_id: eventData.clientId || 6
          })
          .select()
          .single()

        if (error) throw error
        result = data
        break
      }

      case 'search': {
        const { participantId, searchType, query, resultCount, latencyMs } = eventData
        
        const eventTypeId = searchType === 'semantic' 
          ? EVENT_TYPE.SEMANTIC_SEARCH 
          : EVENT_TYPE.FILE_SEARCH

        const { data, error } = await supabase
          .from('participant_events')
          .insert({
            participant_id: participantId,
            event_type_id: eventTypeId,
            details: {
              query,
              resultCount,
              latencyMs
            },
            client_id: eventData.clientId || 6
          })
          .select()
          .single()

        if (error) throw error
        result = data
        break
      }

      case 'button_click': {
        const { participantId, buttonLabel, promptText } = eventData
        
        const { data, error } = await supabase
          .from('participant_events')
          .insert({
            participant_id: participantId,
            event_type_id: EVENT_TYPE.BUTTON_CLICKED,
            details: {
              buttonLabel,
              promptText
            },
            client_id: eventData.clientId || 6
          })
          .select()
          .single()

        if (error) throw error
        result = data
        break
      }

      case 'detailed_log': {
        // For comprehensive event logging with IP, user agent, etc.
        const { 
          participantId, 
          eventTypeId, 
          description, 
          details = {}, 
          ipAddress, 
          userAgent 
        } = eventData

        const { data, error } = await supabase
          .from('participant_event_logs')
          .insert({
            participant_id: participantId,
            event_type_id: eventTypeId,
            description,
            details,
            ip_address: ipAddress || req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
            user_agent: userAgent || req.headers.get('user-agent'),
            client_id: eventData.clientId || 6
          })
          .select()
          .single()

        if (error) throw error
        result = data
        break
      }

      case 'simple_event': {
        // Direct participant event creation
        const { participantId, eventTypeId, details = {} } = eventData

        const { data, error } = await supabase
          .from('participant_events')
          .insert({
            participant_id: participantId,
            event_type_id: eventTypeId,
            details,
            client_id: eventData.clientId || 6
          })
          .select()
          .single()

        if (error) throw error
        result = data
        break
      }

      default:
        throw new Error(`Unknown event type: ${eventType}`)
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error logging event:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
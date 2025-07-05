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
    const { queryType, params = {} } = await req.json()
    
    if (!queryType) {
      throw new Error('queryType is required')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let result

    switch (queryType) {
      case 'participant_events': {
        const { 
          participantId, 
          limit = 50, 
          offset = 0, 
          eventTypeId,
          clientId = 6 
        } = params

        if (!participantId) {
          throw new Error('participantId is required for participant_events query')
        }

        let query = supabase
          .from('participant_events')
          .select(`
            *,
            participant_event_types!inner(
              id,
              name,
              description,
              participant_event_categories(
                id,
                name
              )
            )
          `)
          .eq('participant_id', participantId)
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)

        if (eventTypeId) {
          query = query.eq('event_type_id', eventTypeId)
        }

        const { data, error } = await query

        if (error) throw error
        result = data
        break
      }

      case 'event_logs': {
        const { 
          participantId, 
          startDate, 
          endDate, 
          eventTypeId,
          limit = 100,
          clientId = 6
        } = params

        let query = supabase
          .from('participant_event_logs')
          .select(`
            *,
            participant_event_types(
              id,
              name
            ),
            participants(
              id,
              name
            )
          `)
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })
          .limit(limit)

        if (participantId) {
          query = query.eq('participant_id', participantId)
        }

        if (eventTypeId) {
          query = query.eq('event_type_id', eventTypeId)
        }

        if (startDate) {
          query = query.gte('created_at', startDate)
        }

        if (endDate) {
          query = query.lte('created_at', endDate)
        }

        const { data, error } = await query

        if (error) throw error
        result = data
        break
      }

      case 'event_summary': {
        // Get event counts by type for a participant
        const { participantId, clientId = 6 } = params

        if (!participantId) {
          throw new Error('participantId is required for event_summary query')
        }

        const { data, error } = await supabase
          .from('participant_events')
          .select(`
            event_type_id,
            participant_event_types!inner(
              name,
              description
            )
          `)
          .eq('participant_id', participantId)
          .eq('client_id', clientId)

        if (error) throw error

        // Group and count events by type
        const summary = data.reduce((acc, event) => {
          const typeId = event.event_type_id
          if (!acc[typeId]) {
            acc[typeId] = {
              event_type_id: typeId,
              event_type_name: event.participant_event_types.name,
              count: 0
            }
          }
          acc[typeId].count++
          return acc
        }, {})

        result = Object.values(summary)
        break
      }

      case 'recent_activity': {
        // Get recent events across all participants
        const { 
          limit = 20, 
          categoryName,
          clientId = 6 
        } = params

        let query = supabase
          .from('participant_events')
          .select(`
            *,
            participants(
              id,
              name
            ),
            participant_event_types!inner(
              id,
              name,
              participant_event_categories!inner(
                id,
                name
              )
            )
          `)
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })
          .limit(limit)

        if (categoryName) {
          query = query.eq('participant_event_types.participant_event_categories.name', categoryName)
        }

        const { data, error } = await query

        if (error) throw error
        result = data
        break
      }

      default:
        throw new Error(`Unknown query type: ${queryType}`)
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error retrieving events:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
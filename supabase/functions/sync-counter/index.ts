import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LuggageRecord {
  code: string
  categories: string[]
  observation: string
  has_signature: boolean
}

interface Metadata {
  user: string
  shift: string
  airline: string
}

// Helper to read environment variables in Deno or Node (tests/builds).
function getEnvVar(name: string): string | undefined {
  // Node.js environment
  if (typeof process !== 'undefined' && typeof process.env !== 'undefined') {
    return process.env[name]
  }

  // Deno environment (at runtime in Supabase Functions)
  const deno = (globalThis as any).Deno
  if (deno && deno.env && typeof deno.env.get === 'function') {
    return deno.env.get(name)
  }

  return undefined
}

async function handler(req: Request): Promise<Response> {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create Supabase client using the environment variables provided by Supabase Edge Functions
    // In Supabase Edge Functions, use SUPABASE_URL and SUPABASE_ANON_KEY
    const supabaseUrl = getEnvVar('SUPABASE_URL') || getEnvVar('VITE_SUPABASE_URL')
    const supabaseKey = getEnvVar('SUPABASE_ANON_KEY') || getEnvVar('SUPABASE_SERVICE_ROLE_KEY') || getEnvVar('VITE_SUPABASE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables. Expected SUPABASE_URL and SUPABASE_ANON_KEY')
      return new Response(
        JSON.stringify({ error: 'Server configuration error: missing Supabase env vars' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { metadata, records } = await req.json() as {
      metadata: Metadata
      records: LuggageRecord[]
    }

    console.log('Received sync request:', { metadata, recordCount: records?.length ?? 0 })

    if (!metadata || !records || records.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: metadata and records are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Transform data for database insertion
    const transformedRecords = records.map(record => ({
      codigo: record.code,
      categorias: record.categories,
      observacion: record.observation || null,
      aerolinea: metadata.airline,
      fecha_hora: new Date().toISOString(),
      usuario: metadata.user === 'desconocido' ? null : metadata.user,
      turno: metadata.shift,
      firma: record.has_signature,
    }))

    console.log('Transformed records count:', transformedRecords.length)

    // Insert records into counter table
    const { data, error } = await supabase
      .from('counter')
      .insert(transformedRecords)
      .select()

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const inserted = Array.isArray(data) ? data : []
    console.log('Successfully inserted records count:', inserted.length)

    return new Response(
      JSON.stringify({
        success: true,
        message: `${inserted.length} registros sincronizados correctamente`,
        recordCount: inserted.length
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

// Export the handler for local testing or platforms that import it.
export default handler

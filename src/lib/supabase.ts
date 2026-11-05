import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** False when the deployment is missing its environment variables. */
export const isSupabaseConfigured = Boolean(url && key)

// createClient throws on an empty URL, which would blank the whole page. The
// placeholder lets the app render a readable setup error instead.
export const supabase = createClient(url || 'https://not-configured.invalid', key || 'not-configured')

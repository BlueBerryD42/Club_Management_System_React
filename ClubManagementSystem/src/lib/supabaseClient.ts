import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabase: SupabaseClient | null = null

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase env vars missing: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY')
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
}

export { supabase }
export default supabase

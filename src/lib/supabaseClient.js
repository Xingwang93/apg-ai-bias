import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Console warning to debug if keys are missing
  console.warn('Supabase Keys missing! Realtime features will not work.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

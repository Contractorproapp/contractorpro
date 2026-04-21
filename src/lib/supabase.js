import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || url === 'https://placeholder.supabase.co') {
  console.warn('Supabase not configured — add real values to .env.local to connect to your database.')
}

export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  key || 'placeholder'
)

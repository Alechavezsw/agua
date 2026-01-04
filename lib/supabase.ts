import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  if (typeof window === 'undefined') {
    // Solo mostrar warning en el servidor durante el build
    console.warn('⚠️ Supabase environment variables are not set. Using placeholder values for build.')
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)





import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const configured = Boolean(url && key && !url.includes('YOUR-PROJECT'))

// The browser only ever holds the PUBLIC key. What it may read is decided by the
// row-level-security rules in the database, and it can read only your own rows.
export const supabase = createClient(url || 'http://localhost', key || 'missing', {
  auth: { persistSession: true, autoRefreshToken: true },
})

export const ACCOUNT_LABEL = import.meta.env.VITE_ACCOUNT_LABEL || 'DEMO ACCOUNT'

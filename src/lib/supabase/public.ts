import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { supabaseKey, supabaseUrl } from '@/lib/env'

/** Session-less client for public reads (link-preview images, manifests). */
export function createPublicClient() {
  return createSupabaseClient(supabaseUrl(), supabaseKey(), { auth: { persistSession: false, autoRefreshToken: false } })
}

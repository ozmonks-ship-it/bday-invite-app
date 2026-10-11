import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseKey, supabaseUrl } from '@/lib/env'

/** Supabase client for Server Components, Server Actions and Route Handlers, acting as the signed-in user. */
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(supabaseUrl(), supabaseKey(), {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Called from a Server Component; the proxy refreshes the session instead.
        }
      },
    },
  })
}

export async function getUser() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  return { supabase, user: data.user }
}

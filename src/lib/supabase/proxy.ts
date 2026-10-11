import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { supabaseKey, supabaseUrl } from '@/lib/env'

const PUBLIC_APP_PATHS = ['/app/sign-in', '/app/start', '/app/auth', '/app/manifest.webmanifest']

/** Refreshes the auth cookie and keeps signed-out visitors out of host pages. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })
  const supabase = createServerClient(supabaseUrl(), supabaseKey(), {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        Object.entries(headers ?? {}).forEach(([key, value]) => response.headers.set(key, value))
      },
    },
  })

  const { data } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname
  const isPublic = PUBLIC_APP_PATHS.some((p) => path === p || path.startsWith(p + '/'))
  if (!data.user && path.startsWith('/app') && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/app/sign-in'
    url.search = `?next=${encodeURIComponent(path + request.nextUrl.search)}`
    return NextResponse.redirect(url)
  }
  return response
}

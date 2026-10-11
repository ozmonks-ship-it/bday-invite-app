import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

export async function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  // Host pages, and invite pages themselves (to recognise the host). Not the
  // invite's preview image, icons or manifest, which crawlers fetch.
  matcher: ['/app/:path*', '/i/:slug'],
}

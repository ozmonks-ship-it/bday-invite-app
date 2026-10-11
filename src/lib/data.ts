import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { createPublicClient } from '@/lib/supabase/public'
import type { Invite } from '@/lib/types'

const SLUG = /^[a-zA-Z0-9]{10}$/
export const isSlug = (s: string) => SLUG.test(s)

/** Invite as the current visitor sees it (is_host is true for the party's host). */
export const getInvite = cache(async (slug: string): Promise<Invite | null> => {
  if (!isSlug(slug)) return null
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_invite', { p_slug: slug })
  if (error) throw error
  return (data as Invite | null) ?? null
})

/** Invite without a session, for crawlers and generated images. */
export async function getPublicInvite(slug: string): Promise<Invite | null> {
  if (!isSlug(slug)) return null
  const { data } = await createPublicClient().rpc('get_invite', { p_slug: slug })
  return (data as Invite | null) ?? null
}

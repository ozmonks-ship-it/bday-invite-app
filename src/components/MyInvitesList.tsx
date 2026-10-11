'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getStoredReply, listInvites } from '@/lib/guest-store'
import type { Invite } from '@/lib/types'
import { InviteCard } from './InviteCard'

export function MyInvitesList() {
  const [invites, setInvites] = useState<Invite[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    const slugs = listInvites()
    const request = slugs.length
      ? createClient().rpc('get_invites', { p_slugs: slugs })
      : Promise.resolve({ data: [] as Invite[], error: null })
    request.then(({ data, error }) => {
      if (cancelled) return
      if (error) setFailed(true)
      setInvites((data as Invite[] | null) ?? [])
    })
    return () => { cancelled = true }
  }, [])

  if (failed) return <p className="note"><span>Couldn’t load your invites. Check your connection and refresh.</span></p>
  if (!invites) return <p className="muted">Loading your invites…</p>
  if (!invites.length) return <p className="card" style={{ margin: 0 }}>No invites yet. When someone sends you a Party Pop link, open it and it will appear here.</p>
  return (
    <ul className="list">
      {invites.map((inv) => <InviteCard key={inv.slug} invite={inv} reply={getStoredReply(inv.slug) as never} href={`/i/${inv.slug}`} />)}
    </ul>
  )
}

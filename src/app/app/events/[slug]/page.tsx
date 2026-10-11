import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { InstallBanner } from '@/components/InstallBanner'
import { ReplyManager } from '@/components/ReplyManager'
import { EVENT_COLUMNS, type HostEvent, type HostReply, hhmm, sortedChildren } from '@/lib/host'
import { formatDate, formatTimeRange, partyName } from '@/lib/invite'
import { getUser } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Who’s coming' }

export default async function PartyPage({ params, searchParams }: PageProps<'/app/events/[slug]'>) {
  const { slug } = await params
  const sp = await searchParams
  const { supabase } = await getUser()
  const { data } = await supabase
    .from('events')
    .select(`${EVENT_COLUMNS}, rsvps(id, name, attending, children, adults, note, last_edited_by, updated_at)`)
    .eq('slug', slug)
    .order('updated_at', { referencedTable: 'rsvps', ascending: false })
    .maybeSingle()
  if (!data) notFound()
  const e = data as HostEvent & { rsvps: HostReply[] }
  const name = partyName(sortedChildren(e))
  return (
    <>
      <Breadcrumbs items={[{ label: 'My parties', href: '/app' }, { label: name }]} />
      <main id="main">
        {sp.saved && <p className="saved" role="status" style={{ marginTop: 0 }}>Invite saved. Guests see the changes now.</p>}
        <h1>{name}</h1>
        <p className="lede">{formatDate(e.party_date, 'short')}, {formatTimeRange(hhmm(e.start_time)!, hhmm(e.end_time))} · Who’s coming</p>
        <div className="btns" style={{ marginBottom: 14 }}>
          <Link className="btn small" href={`/app/events/${slug}/edit`}>Edit invite</Link>
          <Link className="btn small blue" href={`/app/events/${slug}/share`}>Share link</Link>
          <Link className="btn small" href={`/i/${slug}`}>View as guest</Link>
        </div>
        <ReplyManager slug={slug} replies={e.rsvps} open={e.rsvps_open} />
      </main>
      <InstallBanner app={{ kind: 'pp', name: 'Party Pop', iconSrc: '/app/icon/192' }} />
    </>
  )
}

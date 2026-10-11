import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Avatars } from '@/components/ChildPhoto'
import { ClaimReplies } from '@/components/ClaimReplies'
import { CheckIcon } from '@/components/Icons'
import { InstallBanner } from '@/components/InstallBanner'
import { InviteCard } from '@/components/InviteCard'
import { EVENT_COLUMNS, type HostEvent, hhmm, sortedChildren, totals } from '@/lib/host'
import { formatDate, formatTimeRange, headline, isPartyOver, partyName, plural } from '@/lib/invite'
import { getUser } from '@/lib/supabase/server'
import type { InviteWithReply } from '@/lib/types'

export const metadata: Metadata = { title: 'My parties' }

export default async function Dashboard() {
  const { supabase, user } = await getUser()
  const [{ data: events }, { data: invited }] = await Promise.all([
    supabase.from('events').select(`${EVENT_COLUMNS}, rsvps(attending, children, adults)`).order('party_date'),
    supabase.rpc('my_invites'),
  ])
  const hosting = (events ?? []) as (HostEvent & { rsvps: { attending: boolean; children: number; adults: number }[] })[]
  const upcoming = hosting.filter((e) => !isPartyOver(e.party_date, e.timezone))
  const past = hosting.filter((e) => isPartyOver(e.party_date, e.timezone)).reverse()
  const invites = (invited ?? []) as InviteWithReply[]

  return (
    <>
      <Breadcrumbs items={[{ label: 'My parties' }]} />
      <main id="main">
        <ClaimReplies />
        <h1>My parties</h1>
        <p className="lede">Signed in as {user?.email}</p>

        <section aria-labelledby="h-hosting">
          <h2 className="eyebrow" id="h-hosting">Hosting</h2>
          {upcoming.length ? (
            <ul className="list">
              {upcoming.map((e) => {
                const kids = sortedChildren(e)
                const t = totals(e.rsvps)
                return (
                  <li className="card" key={e.id}>
                    <div className="row">
                      <Avatars kids={kids} />
                      <div style={{ minWidth: 0 }}>
                        <h3>{headline(kids)}</h3>
                        <p className="muted" style={{ margin: 0 }}>{formatDate(e.party_date, 'short')}, {formatTimeRange(hhmm(e.start_time)!, hhmm(e.end_time))}</p>
                      </div>
                    </div>
                    <p style={{ margin: '12px 0' }}>
                      <span className="tag yes"><CheckIcon /> {plural(t.kids, 'child', 'children')}, {plural(t.adults, 'adult', 'adults')}</span>{' '}
                      <span className="tag">{plural(t.replies, 'reply', 'replies')}</span>
                    </p>
                    <div className="btns">
                      <Link className="btn small sun" href={`/app/events/${e.slug}`}>Replies<span className="sr-only"> for {partyName(kids)}</span></Link>
                      <Link className="btn small" href={`/app/events/${e.slug}/edit`}>Edit<span className="sr-only"> {partyName(kids)}</span></Link>
                      <Link className="btn small blue" href={`/app/events/${e.slug}/share`}>Share<span className="sr-only"> {partyName(kids)}</span></Link>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="card" style={{ margin: 0 }}>You’re not hosting a party yet. Your first invite takes about 3 minutes.</p>
          )}
          <p style={{ marginTop: 12 }}><Link className="btn primary block" href="/app/events/new">+ New party invite</Link></p>
          {past.length > 0 && (
            <ul className="list" style={{ marginTop: 12 }}>
              {past.map((e) => (
                <li className="card" key={e.id}>
                  <h3><Link href={`/app/events/${e.slug}`}>{partyName(sortedChildren(e))}</Link></h3>
                  <p className="muted" style={{ margin: 0 }}>{formatDate(e.party_date, 'short')} · Finished</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="h-invited">
          <h2 className="eyebrow" id="h-invited">Invited to</h2>
          {invites.length ? (
            <ul className="list">
              {invites.map((inv) => <InviteCard key={inv.slug} invite={inv} reply={inv.my_rsvp} href={`/app/invites/${inv.slug}`} />)}
            </ul>
          ) : (
            <p className="card" style={{ margin: 0 }}>Invites you open while signed in, or replied to before creating your account, appear here.</p>
          )}
        </section>
      </main>
      <InstallBanner app={{ kind: 'pp', name: 'Party Pop', iconSrc: '/app/icon/192' }} />
    </>
  )
}

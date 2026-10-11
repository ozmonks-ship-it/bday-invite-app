/* eslint-disable @next/next/no-img-element -- the preview image is generated per invite */
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { ShareActions } from '@/components/ShareActions'
import { EVENT_COLUMNS, type HostEvent, hhmm, sortedChildren } from '@/lib/host'
import { siteUrl } from '@/lib/env'
import { formatDate, formatTimeRange, headline, partyName, shareText } from '@/lib/invite'
import { getUser } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Share the invite' }

export default async function SharePage({ params, searchParams }: PageProps<'/app/events/[slug]/share'>) {
  const { slug } = await params
  const sp = await searchParams
  const { supabase } = await getUser()
  const { data } = await supabase.from('events').select(EVENT_COLUMNS).eq('slug', slug).maybeSingle()
  if (!data) notFound()
  const e = data as HostEvent
  const kids = sortedChildren(e)
  const link = `${siteUrl()}/i/${slug}`
  return (
    <>
      <Breadcrumbs items={[{ label: 'My parties', href: '/app' }, { label: partyName(kids), href: `/app/events/${slug}` }, { label: 'Share link' }]} />
      <main id="main" className="stack">
        {sp.created && <p className="saved" role="status" style={{ margin: 0 }}>Invite ready! Share the link with your guests.</p>}
        <div>
          <h1>Share the invite</h1>
          <p className="lede">Paste this link into your class WhatsApp group or any chat.</p>
        </div>
        <ShareActions link={link} text={shareText({ children: kids }, link)} />
        <section aria-labelledby="preview-h">
          <h2 className="section" id="preview-h">How it looks in a chat</h2>
          <div className="preview">
            <img src={`/i/${slug}/opengraph-image?v=${encodeURIComponent(e.updated_at)}`} alt={`Preview image: ${headline(kids)} ${formatDate(e.party_date, 'short')}`} width={1200} height={630} />
            <p><b>{headline(kids)}</b><br /><span className="muted">{formatDate(e.party_date, 'short')}, {formatTimeRange(hhmm(e.start_time)!, hhmm(e.end_time))} at {e.venue_name}. Tap to reply.</span></p>
          </div>
          <p className="hint">Chat apps keep the preview they saw first. If you change the photos or date after sharing, the old preview may stay on messages already sent, but the invite itself is always up to date.</p>
        </section>
      </main>
    </>
  )
}

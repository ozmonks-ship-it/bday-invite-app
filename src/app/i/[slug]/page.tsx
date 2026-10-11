import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AppBar } from '@/components/AppBar'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { InstallBanner } from '@/components/InstallBanner'
import { InviteView, PartyOver } from '@/components/InviteView'
import { RsvpPanel } from '@/components/RsvpPanel'
import { getInvite } from '@/lib/data'
import { childNames, formatDate, formatTimeRange, headline, isPartyOver, partyName } from '@/lib/invite'
import { getUser } from '@/lib/supabase/server'

export async function generateMetadata({ params }: PageProps<'/i/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const invite = await getInvite(slug)
  if (!invite) return { title: 'Party not found', robots: { index: false } }
  const title = headline(invite.children)
  const description = `${formatDate(invite.party_date, 'short')}, ${formatTimeRange(invite.start_time, invite.end_time)} at ${invite.venue_name}. Tap to reply.`
  const version = encodeURIComponent(invite.updated_at)
  return {
    title,
    description,
    robots: { index: false, follow: false },
    manifest: `/i/${slug}/manifest.webmanifest`,
    appleWebApp: { capable: true, title: childNames(invite.children), statusBarStyle: 'default' },
    icons: { apple: `/i/${slug}/icon/180?v=${version}` },
    openGraph: { type: 'website', siteName: 'Party Pop', title, description, url: `/i/${slug}` },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function InvitePage({ params }: PageProps<'/i/[slug]'>) {
  const { slug } = await params
  const invite = await getInvite(slug)
  if (!invite) notFound()
  const { supabase, user } = await getUser()
  if (user && !invite.is_host) await supabase.rpc('save_invite', { p_slug: slug })

  const name = partyName(invite.children)
  const over = isPartyOver(invite.party_date, invite.timezone)
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <AppBar home={user ? '/app' : '/me'} right={<span className="badge">{user ? 'Signed in' : 'Invite'}</span>} />
      {/* In the invite's own app the root crumb is hidden (see .crumb-root in globals.css) */}
      <Breadcrumbs rootClass="crumb-root" items={[user ? { label: 'My parties', href: '/app' } : { label: 'My invites', href: '/me' }, { label: name }]} />
      <main id="main">
        {invite.is_host && (
          <div className="hostbar"><span>You’re the host</span><Link href={`/app/events/${slug}`}>Manage replies</Link></div>
        )}
        {over ? (
          <PartyOver invite={invite} signedIn={!!user} />
        ) : (
          <>
            <InviteView invite={invite} />
            <RsvpPanel slug={slug} signedIn={!!user} rsvpsOpen={invite.rsvps_open} rsvpBy={invite.rsvp_by} />
          </>
        )}
        {!user && (
          <p className="madewith">Made with Party Pop · <Link href={`/app/start?from=${slug}`}>Make your own invite</Link></p>
        )}
      </main>
      <InstallBanner leaveChatApps app={{ kind: 'invite', name, iconSrc: `/i/${slug}/icon/192?v=${encodeURIComponent(invite.updated_at)}` }} />
    </>
  )
}

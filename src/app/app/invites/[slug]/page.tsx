import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { InviteView, PartyOver } from '@/components/InviteView'
import { RsvpPanel } from '@/components/RsvpPanel'
import { getInvite } from '@/lib/data'
import { isPartyOver, partyName } from '@/lib/invite'
import { getUser } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Invite' }

/** An invite seen inside the Party Pop app, so it stays within the app's scope. */
export default async function InviteInApp({ params }: PageProps<'/app/invites/[slug]'>) {
  const { slug } = await params
  const invite = await getInvite(slug)
  if (!invite) notFound()
  const { supabase } = await getUser()
  if (!invite.is_host) await supabase.rpc('save_invite', { p_slug: slug })
  return (
    <>
      <Breadcrumbs items={[{ label: 'My parties', href: '/app' }, { label: partyName(invite.children) }]} />
      <main id="main">
        {invite.is_host && <div className="hostbar"><span>You’re the host</span><Link href={`/app/events/${slug}`}>Manage replies</Link></div>}
        {isPartyOver(invite.party_date, invite.timezone)
          ? <PartyOver invite={invite} signedIn />
          : <><InviteView invite={invite} /><RsvpPanel slug={slug} signedIn rsvpsOpen={invite.rsvps_open} rsvpBy={invite.rsvp_by} /></>}
      </main>
    </>
  )
}

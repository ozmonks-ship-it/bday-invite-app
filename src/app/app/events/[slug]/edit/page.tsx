import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { deleteEvent } from '@/app/app/events/actions'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { EventForm } from '@/components/EventForm'
import { EVENT_COLUMNS, type HostEvent, hhmm, sortedChildren } from '@/lib/host'
import { partyName } from '@/lib/invite'
import { getUser } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Edit invite' }

export default async function EditEvent({ params }: PageProps<'/app/events/[slug]/edit'>) {
  const { slug } = await params
  const { supabase, user } = await getUser()
  const { data } = await supabase.from('events').select(EVENT_COLUMNS).eq('slug', slug).maybeSingle()
  if (!data) notFound()
  const e = data as HostEvent
  const kids = sortedChildren(e)
  return (
    <>
      <Breadcrumbs items={[{ label: 'My parties', href: '/app' }, { label: partyName(kids), href: `/app/events/${slug}` }, { label: 'Edit invite' }]} />
      <main id="main">
        <h1>Edit invite</h1>
        <p className="lede">Guests see changes straight away.</p>
        <EventForm
          userId={user!.id}
          slug={slug}
          initialKids={kids.map((k) => ({ name: k.name, age: k.age ? String(k.age) : '', photo_path: k.photo_path, photo_alt: k.photo_alt ?? '' }))}
          initialEvent={{
            party_date: e.party_date, start_time: hhmm(e.start_time)!, end_time: hhmm(e.end_time) ?? '',
            venue_name: e.venue_name, venue_address: e.venue_address, venue_maps_url: e.venue_maps_url ?? '',
            parking_notes: e.parking_notes ?? '', parking_location: e.parking_location ?? '', directions: e.directions ?? '',
            message: e.message ?? '', rsvp_by: e.rsvp_by ?? '',
          }}
        />
        <details className="card" style={{ marginTop: 28 }}>
          <summary style={{ fontWeight: 900, cursor: 'pointer' }}>Delete this party</summary>
          <form action={deleteEvent} className="confirm" style={{ marginTop: 12 }}>
            <input type="hidden" name="slug" value={slug} />
            <p style={{ margin: 0 }}>This removes the invite, all replies and the photos. The link will stop working. This can’t be undone.</p>
            <div><button className="btn primary small" type="submit">Delete {partyName(kids)}</button></div>
          </form>
        </details>
      </main>
    </>
  )
}

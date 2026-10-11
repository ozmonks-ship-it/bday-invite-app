import type { Child } from './types'

export type HostEvent = {
  id: string
  slug: string
  party_date: string
  start_time: string
  end_time: string | null
  timezone: string
  venue_name: string
  venue_address: string
  venue_maps_url: string | null
  parking_notes: string | null
  parking_location: string | null
  directions: string | null
  message: string | null
  rsvp_by: string | null
  rsvps_open: boolean
  updated_at: string
  event_children: (Child & { position: number })[]
}

export const EVENT_COLUMNS =
  'id, slug, party_date, start_time, end_time, timezone, venue_name, venue_address, venue_maps_url, parking_notes, parking_location, directions, message, rsvp_by, rsvps_open, updated_at, event_children(name, age, photo_path, photo_alt, position)'

/** Database times come back as HH:MM:SS. */
export const hhmm = (t: string | null) => (t ? t.slice(0, 5) : null)

export function sortedChildren(e: Pick<HostEvent, 'event_children'>): Child[] {
  return [...e.event_children].sort((a, b) => a.position - b.position)
}

export type HostReply = {
  id: string
  name: string
  attending: boolean
  children: number
  adults: number
  note: string | null
  last_edited_by: 'guest' | 'host'
  updated_at: string
}

export function totals(replies: Pick<HostReply, 'attending' | 'children' | 'adults'>[]) {
  const yes = replies.filter((r) => r.attending)
  const kids = yes.reduce((a, r) => a + r.children, 0)
  const adults = yes.reduce((a, r) => a + r.adults, 0)
  return { yes: yes.length, no: replies.length - yes.length, kids, adults, people: kids + adults, replies: replies.length }
}

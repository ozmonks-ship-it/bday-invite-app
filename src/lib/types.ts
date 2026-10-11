export type Child = {
  name: string
  age: number | null
  photo_path: string | null
  photo_alt: string | null
}

/** Public invite fields, as returned by the get_invite database function. */
export type Invite = {
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
  is_host: boolean
  children: Child[]
}

export type Reply = {
  id: string
  name: string
  attending: boolean
  children: number
  adults: number
  note: string | null
  updated_at: string
  last_edited_by: 'guest' | 'host'
  claimed?: boolean
}

export type InviteWithReply = Invite & { my_rsvp: Reply | null }

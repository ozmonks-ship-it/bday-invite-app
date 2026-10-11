import type { Child, Invite } from './types'

export const MAX_CHILDREN = 4

export function joinAnd(items: string[], and: string): string {
  if (items.length < 2) return items.join('')
  return items.slice(0, -1).join(', ') + and + items[items.length - 1]
}

/** "Maya", "Maya & Leo", "Maya, Leo & Ada" */
export function childNames(children: Pick<Child, 'name'>[]): string {
  const names = children.map((c) => c.name.trim() || 'Birthday star')
  return names.length ? joinAnd(names, ' & ') : 'Birthday star'
}

/** "Maya is turning 6!", "Maya & Leo are turning 6 and 4!", or a fallback when an age is missing. */
export function headline(children: Pick<Child, 'name' | 'age'>[]): string {
  const names = childNames(children)
  if (!children.length || children.some((c) => !c.age)) return `${names}’s birthday party!`
  const ages = children.map((c) => String(c.age))
  return children.length === 1 ? `${names} is turning ${ages[0]}!` : `${names} are turning ${joinAnd(ages, ' and ')}!`
}

export const partyName = (children: Pick<Child, 'name'>[]) => `${childNames(children)}’s party`

/**
 * Formats a calendar date (YYYY-MM-DD) without shifting it across time zones.
 * Built from parts so server and browser render identical text whatever their ICU data.
 */
export function formatDate(isoDate: string, style: 'long' | 'short' = 'long'): string {
  const d = new Date(isoDate + 'T00:00:00Z')
  if (Number.isNaN(d.getTime())) return isoDate
  const width = style === 'long' ? 'long' : 'short'
  const parts = new Intl.DateTimeFormat('en-GB', {
    weekday: width, day: 'numeric', month: width, year: 'numeric', timeZone: 'UTC',
  }).formatToParts(d)
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? ''
  const base = `${part('weekday')} ${part('day')} ${part('month')}`
  return style === 'long' ? `${base} ${part('year')}` : base
}

/** "14:00" → "2pm", "16:30" → "4:30pm" */
export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  if (Number.isNaN(h)) return hhmm
  const suffix = h >= 12 ? 'pm' : 'am'
  const hour = ((h + 11) % 12) + 1
  return `${hour}${m ? ':' + String(m).padStart(2, '0') : ''}${suffix}`
}

export const formatTimeRange = (start: string, end?: string | null) =>
  formatTime(start) + (end ? '–' + formatTime(end) : '')

export const mapsUrl = (query: string) =>
  'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query)

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** "2 children, 1 adult" */
export function groupText(children: number, adults: number): string {
  return [children ? plural(children, 'child', 'children') : '', adults ? plural(adults, 'adult', 'adults') : '']
    .filter(Boolean)
    .join(', ')
}

export function venueMapsUrl(invite: Pick<Invite, 'venue_maps_url' | 'venue_name' | 'venue_address'>): string {
  return invite.venue_maps_url || mapsUrl(`${invite.venue_name}, ${invite.venue_address}`)
}

export function photoUrl(supabaseUrl: string, path: string | null | undefined): string | null {
  return path ? `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/invite-photos/${path}` : null
}

/** Has the party date passed? Compared as calendar dates in the party's time zone. */
export function isPartyOver(partyDate: string, timeZone: string, now = new Date()): boolean {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
  return today > partyDate
}

export function shareText(invite: Pick<Invite, 'children'>, link: string): string {
  return `You're invited to ${childNames(invite.children)}'s party! ${link}`
}

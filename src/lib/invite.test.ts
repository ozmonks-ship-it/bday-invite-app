import { describe, expect, it } from 'vitest'
import { childNames, formatDate, formatTime, formatTimeRange, groupText, headline, isPartyOver, mapsUrl, partyName, photoUrl } from './invite'

const maya = { name: 'Maya', age: 6 }
const leo = { name: 'Leo', age: 4 }

describe('invite text', () => {
  it('names one, two and three children', () => {
    expect(childNames([maya])).toBe('Maya')
    expect(childNames([maya, leo])).toBe('Maya & Leo')
    expect(childNames([maya, leo, { name: 'Ada', age: 2 }])).toBe('Maya, Leo & Ada')
  })
  it('writes the headline for one child and for siblings', () => {
    expect(headline([maya])).toBe('Maya is turning 6!')
    expect(headline([maya, leo])).toBe('Maya & Leo are turning 6 and 4!')
  })
  it('falls back when an age is missing', () => {
    expect(headline([maya, { name: 'Leo', age: null }])).toBe('Maya & Leo’s birthday party!')
  })
  it('names the party', () => expect(partyName([maya, leo])).toBe('Maya & Leo’s party'))
  it('describes group sizes', () => {
    expect(groupText(2, 1)).toBe('2 children, 1 adult')
    expect(groupText(0, 3)).toBe('3 adults')
  })
})

describe('dates and times', () => {
  it('formats a calendar date without time-zone drift', () => {
    expect(formatDate('2026-11-14')).toBe('Saturday 14 November 2026')
    expect(formatDate('2026-11-14', 'short')).toBe('Sat 14 Nov')
  })
  it('formats times in 12-hour style', () => {
    expect(formatTime('14:00')).toBe('2pm')
    expect(formatTime('00:30')).toBe('12:30am')
    expect(formatTime('12:00')).toBe('12pm')
    expect(formatTimeRange('14:00', '16:30')).toBe('2pm–4:30pm')
    expect(formatTimeRange('10:00', null)).toBe('10am')
  })
  it('knows when the party is over in the party’s time zone', () => {
    // 23:30 UTC on 14 Nov is still 14 Nov in London, but 15 Nov in Sydney
    const now = new Date('2026-11-14T23:30:00Z')
    expect(isPartyOver('2026-11-14', 'Europe/London', now)).toBe(false)
    expect(isPartyOver('2026-11-14', 'Australia/Sydney', now)).toBe(true)
  })
})

describe('links', () => {
  it('builds Google Maps search links', () => {
    expect(mapsUrl('Jump Planet, 12 Riverside Way')).toBe(
      'https://www.google.com/maps/search/?api=1&query=Jump%20Planet%2C%2012%20Riverside%20Way',
    )
  })
  it('builds public photo URLs', () => {
    expect(photoUrl('https://x.supabase.co/', 'u/p.jpg')).toBe('https://x.supabase.co/storage/v1/object/public/invite-photos/u/p.jpg')
    expect(photoUrl('https://x.supabase.co', null)).toBeNull()
  })
})

import { describe, expect, it } from 'vitest'
import { eventSchema, fieldErrors, replySchema } from './validation'

describe('replySchema', () => {
  it('accepts a family reply', () => {
    const r = replySchema.parse({ name: ' Jess ', attending: true, children: '2', adults: 1, note: '' })
    expect(r).toEqual({ name: 'Jess', attending: true, children: 2, adults: 1, note: null })
  })
  it('zeroes counts when not coming', () => {
    expect(replySchema.parse({ name: 'Okafors', attending: false, children: 3, adults: 2 })).toMatchObject({ children: 0, adults: 0 })
  })
  it('needs at least one person when coming', () => {
    const res = replySchema.safeParse({ name: 'Jess', attending: true, children: 0, adults: 0 })
    expect(res.success).toBe(false)
    if (!res.success) expect(fieldErrors(res.error).children).toMatch(/at least one/)
  })
  it('needs a name', () => {
    expect(replySchema.safeParse({ name: '  ', attending: false, children: 0, adults: 0 }).success).toBe(false)
  })
})

describe('eventSchema', () => {
  const base = {
    children: [{ name: 'Maya', age: '6', photo_path: null, photo_alt: '' }],
    party_date: '2026-11-14',
    start_time: '14:00',
    end_time: '16:30',
    venue_name: 'Jump Planet',
    venue_address: '12 Riverside Way',
    venue_maps_url: '',
    rsvp_by: '',
  }
  it('accepts a complete invite and normalises blanks', () => {
    const e = eventSchema.parse(base)
    expect(e.children[0]).toEqual({ name: 'Maya', age: 6, photo_path: null, photo_alt: null })
    expect(e.venue_maps_url).toBeNull()
    expect(e.rsvp_by).toBeNull()
  })
  it('rejects an end time before the start', () => {
    const res = eventSchema.safeParse({ ...base, end_time: '13:00' })
    expect(res.success).toBe(false)
    if (!res.success) expect(fieldErrors(res.error).end_time).toBeDefined()
  })
  it('allows up to four children', () => {
    const kids = Array.from({ length: 5 }, (_, i) => ({ name: 'K' + i, age: '', photo_path: null }))
    expect(eventSchema.safeParse({ ...base, children: kids }).success).toBe(false)
    expect(eventSchema.safeParse({ ...base, children: kids.slice(0, 4) }).success).toBe(true)
  })
  it('only accepts photo paths in the upload format', () => {
    const bad = { ...base, children: [{ ...base.children[0], photo_path: '../other/secret.jpg' }] }
    expect(eventSchema.safeParse(bad).success).toBe(false)
  })
  it('only accepts https map links', () => {
    expect(eventSchema.safeParse({ ...base, venue_maps_url: 'javascript:alert(1)' }).success).toBe(false)
    expect(eventSchema.safeParse({ ...base, venue_maps_url: 'https://maps.app.goo.gl/abc' }).success).toBe(true)
  })
})

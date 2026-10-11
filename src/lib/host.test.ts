import { describe, expect, it } from 'vitest'
import { hhmm, sortedChildren, totals } from './host'

describe('host helpers', () => {
  it('adds up children and adults from yes replies only', () => {
    const t = totals([
      { attending: true, children: 2, adults: 1 },
      { attending: true, children: 1, adults: 2 },
      { attending: false, children: 0, adults: 0 },
    ])
    expect(t).toEqual({ yes: 2, no: 1, kids: 3, adults: 3, people: 6, replies: 3 })
  })
  it('trims database times', () => {
    expect(hhmm('14:00:00')).toBe('14:00')
    expect(hhmm(null)).toBeNull()
  })
  it('orders children by position', () => {
    const kids = sortedChildren({ event_children: [
      { name: 'Leo', age: 4, photo_path: null, photo_alt: null, position: 2 },
      { name: 'Maya', age: 6, photo_path: null, photo_alt: null, position: 1 },
    ] })
    expect(kids.map((k) => k.name)).toEqual(['Maya', 'Leo'])
  })
})

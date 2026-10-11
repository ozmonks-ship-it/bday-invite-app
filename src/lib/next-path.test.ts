import { describe, expect, it } from 'vitest'
import { safeNext } from './next-path'

describe('safeNext', () => {
  it('keeps app and invite paths', () => {
    expect(safeNext('/app/events/abc')).toBe('/app/events/abc')
    expect(safeNext('/i/mx7Kq2pLab')).toBe('/i/mx7Kq2pLab')
    expect(safeNext('/app?x=1')).toBe('/app?x=1')
  })
  it('rejects other sites and odd paths', () => {
    expect(safeNext('https://evil.example')).toBe('/app')
    expect(safeNext('//evil.example/app')).toBe('/app')
    expect(safeNext('/\\evil.example')).toBe('/app')
    expect(safeNext('/apple')).toBe('/app')
    expect(safeNext(null)).toBe('/app')
  })
})

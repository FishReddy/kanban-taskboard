import { describe, expect, it } from 'vitest'
import { formatRelativeTime } from './time'

describe('formatRelativeTime', () => {
  const now = new Date('2026-06-15T12:00:00Z')
  const format = (timestamp: string) => formatRelativeTime(timestamp, now, 'en-US')

  it('treats the last minute and small clock differences as just now', () => {
    expect(format('2026-06-15T11:59:30Z')).toBe('just now')
    expect(format('2026-06-15T12:00:05Z')).toBe('just now')
  })

  it('counts minutes, hours and days', () => {
    expect(format('2026-06-15T11:55:00Z')).toBe('5 minutes ago')
    expect(format('2026-06-15T10:00:00Z')).toBe('2 hours ago')
    expect(format('2026-06-14T12:00:00Z')).toBe('1 day ago')
  })

  it('switches to a date after a week, with the year only if it differs', () => {
    expect(format('2026-06-01T12:00:00Z')).toBe('Jun 1')
    expect(format('2025-06-01T12:00:00Z')).toBe('Jun 1, 2025')
  })
})

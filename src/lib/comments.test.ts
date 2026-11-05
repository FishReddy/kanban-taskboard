import { describe, expect, it } from 'vitest'
import { describeCommentCount, formatRelativeTime, groupCommentsByTask } from './comments'
import type { TaskComment } from './types'

function comment(id: string, task_id: string, created_at: string): TaskComment {
  return { id, task_id, created_at, body: 'Body', user_id: 'user' }
}

describe('groupCommentsByTask', () => {
  it('groups by task and sorts oldest first', () => {
    const grouped = groupCommentsByTask([
      comment('newer', 'a', '2026-01-02T00:00:00Z'),
      comment('other', 'b', '2026-01-01T12:00:00Z'),
      comment('older', 'a', '2026-01-01T00:00:00Z'),
    ])
    expect(grouped.get('a')?.map((c) => c.id)).toEqual(['older', 'newer'])
    expect(grouped.get('b')?.map((c) => c.id)).toEqual(['other'])
    expect(grouped.get('missing')).toBeUndefined()
  })
})

describe('describeCommentCount', () => {
  it('uses the singular only for one', () => {
    expect(describeCommentCount(1)).toBe('1 comment')
    expect(describeCommentCount(2)).toBe('2 comments')
  })
})

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

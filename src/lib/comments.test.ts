import { describe, expect, it } from 'vitest'
import { describeCommentCount, groupCommentsByTask } from './comments'
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

import { describe, expect, it } from 'vitest'
import { computeBoardStats } from './stats'
import type { TaskStatus } from './types'

const now = new Date(2026, 5, 15, 12)

function task(status: TaskStatus, due_date: string | null = null) {
  return { status, due_date }
}

describe('computeBoardStats', () => {
  it('counts nothing on an empty board', () => {
    expect(computeBoardStats([], now)).toEqual({ total: 0, completed: 0, overdue: 0 })
  })

  it('counts total, completed and overdue tasks', () => {
    const tasks = [
      task('todo'),
      task('in_progress', '2026-06-14'),
      task('in_review', '2026-06-01'),
      task('done'),
    ]
    expect(computeBoardStats(tasks, now)).toEqual({ total: 4, completed: 1, overdue: 2 })
  })

  it('does not count a task due today as overdue', () => {
    expect(computeBoardStats([task('todo', '2026-06-15')], now).overdue).toBe(0)
  })

  it('does not count finished work as overdue', () => {
    const stats = computeBoardStats([task('done', '2026-06-01')], now)
    expect(stats.completed).toBe(1)
    expect(stats.overdue).toBe(0)
  })
})

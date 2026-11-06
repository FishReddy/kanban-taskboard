import { describe, expect, it } from 'vitest'
import { groupByStatus, parseLocalDate, positionBetween, topPosition } from './board'
import type { Task } from './types'

function task(overrides: Partial<Task>): Task {
  return {
    id: 'id',
    title: 'title',
    description: null,
    status: 'todo',
    priority: 'none',
    due_date: null,
    position: 0,
    user_id: 'user',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    assignee_ids: [],
    label_ids: [],
    ...overrides,
  }
}

describe('positionBetween', () => {
  it('starts an empty column at a positive gap', () => {
    expect(positionBetween(undefined, undefined)).toBe(1024)
  })

  it('places a task before the first and after the last', () => {
    expect(positionBetween(undefined, 1024)).toBe(0)
    expect(positionBetween(1024, undefined)).toBe(2048)
  })

  it('places a task strictly between its neighbours', () => {
    const position = positionBetween(1, 2)
    expect(position).toBeGreaterThan(1)
    expect(position).toBeLessThan(2)
  })
})

describe('groupByStatus', () => {
  it('returns every column, even when empty', () => {
    expect(Object.keys(groupByStatus([]))).toEqual(['todo', 'in_progress', 'in_review', 'done'])
  })

  it('orders by position, then by creation time', () => {
    const grouped = groupByStatus([
      task({ id: 'late', position: 5, created_at: '2026-01-02T00:00:00Z' }),
      task({ id: 'early', position: 5, created_at: '2026-01-01T00:00:00Z' }),
      task({ id: 'first', position: 1 }),
      task({ id: 'other', status: 'done', position: 0 }),
    ])
    expect(grouped.todo.map((t) => t.id)).toEqual(['first', 'early', 'late'])
    expect(grouped.done.map((t) => t.id)).toEqual(['other'])
  })
})

describe('topPosition', () => {
  it('sorts above the current first task in that column only', () => {
    const tasks = [task({ position: 100 }), task({ status: 'done', position: -5000 })]
    expect(topPosition(tasks, 'todo')).toBeLessThan(100)
    expect(topPosition(tasks, 'todo')).toBeGreaterThan(-5000)
  })
})

describe('parseLocalDate', () => {
  it('keeps the calendar day regardless of time zone', () => {
    const date = parseLocalDate('2026-03-09')
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 2, 9])
  })
})

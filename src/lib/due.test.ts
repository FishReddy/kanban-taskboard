import { describe, expect, it } from 'vitest'
import { getDueInfo } from './due'
import type { TaskStatus } from './types'

// Late in the day, to catch anything comparing times instead of calendar days.
const now = new Date(2026, 5, 15, 23, 30)

function info(due_date: string | null, status: TaskStatus = 'todo') {
  return getDueInfo({ due_date, status }, now)
}

describe('getDueInfo', () => {
  it('returns nothing without a due date', () => {
    expect(info(null)).toBeNull()
  })

  it('counts past dates as overdue', () => {
    expect(info('2026-06-14')).toMatchObject({ urgency: 'overdue', label: '1 day overdue' })
    expect(info('2026-06-05')).toMatchObject({ urgency: 'overdue', label: '10 days overdue' })
  })

  it('does not call a task overdue until the day after its due date', () => {
    expect(info('2026-06-15')).toMatchObject({ urgency: 'today', label: 'Due today' })
  })

  it('counts the next three days as soon', () => {
    expect(info('2026-06-16')).toMatchObject({ urgency: 'soon', label: 'Due tomorrow' })
    expect(info('2026-06-17')).toMatchObject({ urgency: 'soon', label: 'Due in 2 days' })
    expect(info('2026-06-18')).toMatchObject({ urgency: 'soon', label: 'Due in 3 days' })
  })

  it('shows only the date further out', () => {
    const result = info('2026-06-19')
    expect(result?.urgency).toBe('none')
    expect(result?.label).toBe(result?.detail.replace('Due ', ''))
  })

  it('never treats finished work as urgent', () => {
    expect(info('2026-06-01', 'done')?.urgency).toBe('none')
    expect(info('2026-06-15', 'done')?.urgency).toBe('none')
  })

  it('counts calendar days across a month boundary and daylight saving', () => {
    const march = new Date(2026, 2, 7, 12)
    expect(getDueInfo({ due_date: '2026-03-09', status: 'todo' }, march)?.label).toBe('Due in 2 days')
    const monthEnd = new Date(2026, 0, 31, 12)
    expect(getDueInfo({ due_date: '2026-02-01', status: 'todo' }, monthEnd)?.label).toBe('Due tomorrow')
  })
})

import { describe, expect, it } from 'vitest'
import { describeActivity } from './activity'
import type { ActivityAction, TaskActivity } from './types'

function describeEntry(action: ActivityAction, from_value: string | null, to_value: string | null) {
  const entry: TaskActivity = {
    id: 'id',
    task_id: 'task',
    action,
    from_value,
    to_value,
    created_at: '2026-06-15T12:00:00Z',
  }
  return describeActivity(entry, new Date(2026, 5, 15))
}

describe('describeActivity', () => {
  it('describes creation and description changes without values', () => {
    expect(describeEntry('created', null, null)).toBe('Created this task')
    expect(describeEntry('description', null, null)).toBe('Updated the description')
  })

  it('uses column titles and priority labels, not stored keys', () => {
    expect(describeEntry('status', 'todo', 'in_progress')).toBe('Moved from To Do → In Progress')
    expect(describeEntry('priority', 'medium', 'high')).toBe('Changed priority from Medium to High')
  })

  it('reads naturally when a priority is first set or removed', () => {
    expect(describeEntry('priority', 'none', 'low')).toBe('Set the priority to Low')
    expect(describeEntry('priority', 'high', 'none')).toBe('Removed the priority')
  })

  it('quotes old and new titles', () => {
    expect(describeEntry('title', 'Old', 'New')).toBe('Renamed from “Old” to “New”')
  })

  it('handles a due date being set, changed and removed', () => {
    const june = new Date(2026, 5, 20).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    const july = new Date(2026, 6, 1).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    expect(describeEntry('due_date', null, '2026-06-20')).toBe(`Set the due date to ${june}`)
    expect(describeEntry('due_date', '2026-06-20', '2026-07-01')).toBe(
      `Changed the due date from ${june} to ${july}`,
    )
    expect(describeEntry('due_date', '2026-06-20', null)).toBe('Removed the due date')
  })

  it('names the person for assignment changes', () => {
    expect(describeEntry('assigned', null, 'Ada')).toBe('Assigned Ada')
    expect(describeEntry('unassigned', 'Ada', null)).toBe('Unassigned Ada')
  })

  it('names the label for label changes', () => {
    expect(describeEntry('labeled', null, 'Bug')).toBe('Added the label Bug')
    expect(describeEntry('unlabeled', 'Bug', null)).toBe('Removed the label Bug')
  })
})

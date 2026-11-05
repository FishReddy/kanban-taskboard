import { describe, expect, it } from 'vitest'
import { filterTasksByLabels, isLabelNameTaken, resolveLabels } from './labels'
import type { Label, Task } from './types'

function label(id: string, name = 'Name'): Label {
  return { id, name, color: '#5b5bd6', user_id: 'user', created_at: '2026-01-01T00:00:00Z' }
}

function task(id: string, label_ids: string[]): Task {
  return {
    id,
    label_ids,
    title: 'title',
    description: null,
    status: 'todo',
    priority: 'normal',
    due_date: null,
    position: 0,
    user_id: 'user',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    assignee_ids: [],
  }
}

describe('resolveLabels', () => {
  it('keeps order and skips deleted labels', () => {
    const a = label('a')
    const b = label('b')
    const byId = new Map([
      ['a', a],
      ['b', b],
    ])
    expect(resolveLabels(['b', 'gone', 'a'], byId)).toEqual([b, a])
  })
})

describe('filterTasksByLabels', () => {
  const tasks = [task('one', ['x']), task('two', ['x', 'y']), task('three', ['z']), task('none', [])]
  const ids = (labelIds: string[]) => filterTasksByLabels(tasks, labelIds).map((t) => t.id)

  it('returns everything when no label is selected', () => {
    expect(ids([])).toEqual(['one', 'two', 'three', 'none'])
  })

  it('keeps tasks with any selected label', () => {
    expect(ids(['y'])).toEqual(['two'])
    expect(ids(['y', 'z'])).toEqual(['two', 'three'])
  })

  it('returns nothing when no task has the label', () => {
    expect(ids(['unused'])).toEqual([])
  })
})

describe('isLabelNameTaken', () => {
  const labels = [label('a', 'Bug'), label('b', 'Feature')]

  it('ignores case and outer spaces', () => {
    expect(isLabelNameTaken('  bUG ', labels)).toBe(true)
    expect(isLabelNameTaken('Bugfix', labels)).toBe(false)
  })

  it('lets a label keep its own name when edited', () => {
    expect(isLabelNameTaken('bug', labels, 'a')).toBe(false)
    expect(isLabelNameTaken('feature', labels, 'a')).toBe(true)
  })
})

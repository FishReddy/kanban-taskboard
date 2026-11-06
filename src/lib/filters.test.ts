import { describe, expect, it } from 'vitest'
import {
  hasActiveFilters,
  matchesFilters,
  newTaskValues,
  NO_FILTERS,
  pruneFilters,
  UNASSIGNED,
  type BoardFilterValues,
} from './filters'
import type { TaskPriority, TeamMember } from './types'

const members = new Map([['ada', { id: 'ada' } as TeamMember]])

function task(
  title: string,
  priority: TaskPriority = 'none',
  assignee_ids: string[] = [],
  label_ids: string[] = [],
) {
  return { title, priority, assignee_ids, label_ids }
}

function matches(item: ReturnType<typeof task>, filters: Partial<BoardFilterValues>) {
  return matchesFilters(item, { ...NO_FILTERS, ...filters }, members)
}

describe('matchesFilters', () => {
  it('matches everything with no filters', () => {
    expect(matches(task('Anything'), {})).toBe(true)
  })

  it('searches titles ignoring case and outer spaces', () => {
    expect(matches(task('Fix the Login page'), { query: '  LOGIN ' })).toBe(true)
    expect(matches(task('Fix the Login page'), { query: 'logout' })).toBe(false)
  })

  it('treats a search of only spaces as no search', () => {
    expect(matches(task('Anything'), { query: '   ' })).toBe(true)
  })

  it('filters by priority', () => {
    expect(matches(task('A', 'high'), { priority: 'high' })).toBe(true)
    expect(matches(task('A', 'low'), { priority: 'high' })).toBe(false)
  })

  it('can find tasks with no priority', () => {
    expect(matches(task('A', 'none'), { priority: 'none' })).toBe(true)
    expect(matches(task('A', 'medium'), { priority: 'none' })).toBe(false)
    expect(hasActiveFilters({ ...NO_FILTERS, priority: 'none' })).toBe(true)
  })

  it('filters by assignee', () => {
    expect(matches(task('A', 'medium', ['ada']), { assignee: 'ada' })).toBe(true)
    expect(matches(task('A', 'medium', []), { assignee: 'ada' })).toBe(false)
  })

  it('finds unassigned tasks, including those whose only assignee was just removed', () => {
    expect(matches(task('A'), { assignee: UNASSIGNED })).toBe(true)
    expect(matches(task('A', 'medium', ['gone']), { assignee: UNASSIGNED })).toBe(true)
    expect(matches(task('A', 'medium', ['ada']), { assignee: UNASSIGNED })).toBe(false)
  })

  it('matches any of several labels', () => {
    expect(matches(task('A', 'medium', [], ['x']), { labelIds: ['x', 'y'] })).toBe(true)
    expect(matches(task('A', 'medium', [], ['z']), { labelIds: ['x', 'y'] })).toBe(false)
  })

  it('requires every kind of filter to match', () => {
    const item = task('Login bug', 'high', ['ada'], ['x'])
    const all: BoardFilterValues = { query: 'login', priority: 'high', assignee: 'ada', labelIds: ['x'] }
    expect(matches(item, all)).toBe(true)
    expect(matches(item, { ...all, query: 'other' })).toBe(false)
    expect(matches(item, { ...all, priority: 'low' })).toBe(false)
    expect(matches(item, { ...all, labelIds: ['y'] })).toBe(false)
  })
})

describe('hasActiveFilters', () => {
  it('ignores a blank search', () => {
    expect(hasActiveFilters(NO_FILTERS)).toBe(false)
    expect(hasActiveFilters({ ...NO_FILTERS, query: '  ' })).toBe(false)
  })

  it('notices each kind of filter', () => {
    expect(hasActiveFilters({ ...NO_FILTERS, query: 'a' })).toBe(true)
    expect(hasActiveFilters({ ...NO_FILTERS, priority: 'low' })).toBe(true)
    expect(hasActiveFilters({ ...NO_FILTERS, assignee: UNASSIGNED })).toBe(true)
    expect(hasActiveFilters({ ...NO_FILTERS, labelIds: ['x'] })).toBe(true)
  })
})

describe('pruneFilters', () => {
  const labels = new Map([['x', {}]])

  it('keeps selections that still exist', () => {
    const filters = { ...NO_FILTERS, assignee: 'ada', labelIds: ['x'] }
    expect(pruneFilters(filters, members, labels)).toEqual(filters)
    expect(pruneFilters({ ...NO_FILTERS, assignee: UNASSIGNED }, members, labels).assignee).toBe(UNASSIGNED)
  })

  it('drops deleted members and labels', () => {
    const pruned = pruneFilters({ ...NO_FILTERS, assignee: 'gone', labelIds: ['x', 'gone'] }, members, labels)
    expect(pruned.assignee).toBeNull()
    expect(pruned.labelIds).toEqual(['x'])
  })
})

describe('newTaskValues', () => {
  it('uses defaults with no filters', () => {
    expect(newTaskValues(NO_FILTERS)).toEqual({ priority: 'none', assignee_ids: [], label_ids: [] })
  })

  it('copies the active filters', () => {
    expect(newTaskValues({ query: 'x', priority: 'high', assignee: 'ada', labelIds: ['y'] })).toEqual({
      priority: 'high',
      assignee_ids: ['ada'],
      label_ids: ['y'],
    })
  })

  it('assigns nobody when filtering for unassigned tasks', () => {
    expect(newTaskValues({ ...NO_FILTERS, assignee: UNASSIGNED }).assignee_ids).toEqual([])
  })
})

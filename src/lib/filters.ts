import type { Task, TaskDraft, TaskPriority, TeamMember } from './types'

/** The assignee filter's value for tasks with nobody on them. */
export const UNASSIGNED = 'unassigned'

export interface BoardFilterValues {
  query: string
  priority: TaskPriority | null
  /** A team member's id, or UNASSIGNED. */
  assignee: string | null
  labelIds: string[]
}

export const NO_FILTERS: BoardFilterValues = { query: '', priority: null, assignee: null, labelIds: [] }

type MembersById = ReadonlyMap<string, TeamMember>
type FilterableTask = Pick<Task, 'title' | 'priority' | 'assignee_ids' | 'label_ids'>

export function hasActiveFilters(filters: BoardFilterValues): boolean {
  return (
    filters.query.trim() !== '' ||
    filters.priority !== null ||
    filters.assignee !== null ||
    filters.labelIds.length > 0
  )
}

/** Different filters narrow each other. Selecting several labels widens the match. */
export function matchesFilters(
  task: FilterableTask,
  filters: BoardFilterValues,
  membersById: MembersById,
): boolean {
  const query = filters.query.trim().toLocaleLowerCase()
  if (query && !task.title.toLocaleLowerCase().includes(query)) return false
  if (filters.priority && task.priority !== filters.priority) return false
  if (filters.labelIds.length > 0 && !task.label_ids.some((id) => filters.labelIds.includes(id))) {
    return false
  }
  if (filters.assignee === UNASSIGNED) {
    // Tasks can briefly hold the id of a member who was just removed.
    return !task.assignee_ids.some((id) => membersById.has(id))
  }
  return filters.assignee === null || task.assignee_ids.includes(filters.assignee)
}

/** Drops selections whose member or label has since been deleted. */
export function pruneFilters(
  filters: BoardFilterValues,
  membersById: MembersById,
  labelsById: ReadonlyMap<string, unknown>,
): BoardFilterValues {
  const { assignee } = filters
  return {
    ...filters,
    assignee: assignee === UNASSIGNED || (assignee && membersById.has(assignee)) ? assignee : null,
    labelIds: filters.labelIds.filter((id) => labelsById.has(id)),
  }
}

/** A new task starts with the active filters' values, so it stays visible. */
export function newTaskValues(
  filters: BoardFilterValues,
): Pick<TaskDraft, 'priority' | 'assignee_ids' | 'label_ids'> {
  return {
    priority: filters.priority ?? 'normal',
    assignee_ids: filters.assignee && filters.assignee !== UNASSIGNED ? [filters.assignee] : [],
    label_ids: filters.labelIds,
  }
}

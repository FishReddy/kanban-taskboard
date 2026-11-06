import { STATUSES, type Task, type TaskPriority, type TaskStatus } from './types'

export const COLUMNS: Record<TaskStatus, { title: string; emptyHint: string }> = {
  todo: { title: 'To Do', emptyHint: 'Nothing queued. Add the next thing worth doing.' },
  in_progress: { title: 'In Progress', emptyHint: 'Drag a task here when work starts.' },
  in_review: { title: 'In Review', emptyHint: 'Tasks waiting on a second look land here.' },
  done: { title: 'Done', emptyHint: 'Finished work collects here.' },
}

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  none: 'None',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

export type TasksByStatus = Record<TaskStatus, Task[]>

/** Sorts tasks into columns, ordered by position, oldest first on ties. */
export function groupByStatus(tasks: Task[]): TasksByStatus {
  const grouped = Object.fromEntries(STATUSES.map((status) => [status, [] as Task[]])) as TasksByStatus
  for (const task of tasks) grouped[task.status].push(task)
  for (const status of STATUSES) {
    grouped[status].sort(
      (a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at),
    )
  }
  return grouped
}

const POSITION_GAP = 1024

/**
 * Sort key for a task placed between two neighbours. Either may be missing at
 * the start or end of a column, and both are missing in an empty column.
 */
export function positionBetween(before: number | undefined, after: number | undefined): number {
  if (before === undefined && after === undefined) return POSITION_GAP
  if (before === undefined) return after! - POSITION_GAP
  if (after === undefined) return before + POSITION_GAP
  return (before + after) / 2
}

/** Sort key that places a task at the top of the given column. */
export function topPosition(tasks: Task[], status: TaskStatus): number {
  return positionBetween(undefined, groupByStatus(tasks)[status][0]?.position)
}

/**
 * Parses a YYYY-MM-DD date as local midnight. `new Date('YYYY-MM-DD')` reads it
 * as UTC, which shows the previous day in time zones behind UTC.
 */
export function parseLocalDate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function formatDueDate(date: string, now = new Date()): string {
  const parsed = parseLocalDate(date)
  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(parsed.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }),
  })
}

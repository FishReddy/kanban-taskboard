import { formatDueDate, parseLocalDate } from './board'
import type { Task } from './types'

export type DueUrgency = 'overdue' | 'today' | 'soon' | 'none'

export interface DueInfo {
  urgency: DueUrgency
  /** Short text for the badge on a card. */
  label: string
  /** The date itself, for a tooltip and screen readers. */
  detail: string
}

/** Tasks due within this many days count as due soon. */
const SOON_DAYS = 3
const DAY_MS = 86_400_000

/** Whole calendar days until a date. Rounding absorbs daylight saving shifts. */
function daysUntil(date: string, now: Date): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((parseLocalDate(date).getTime() - today.getTime()) / DAY_MS)
}

/**
 * How urgent a task's due date is, or null if it has none. Finished work is
 * never urgent, so a task in Done just shows its date.
 */
export function getDueInfo(
  task: Pick<Task, 'due_date' | 'status'>,
  now = new Date(),
): DueInfo | null {
  if (!task.due_date) return null

  const date = formatDueDate(task.due_date, now)
  const detail = `Due ${date}`
  if (task.status === 'done') return { urgency: 'none', label: date, detail }

  const days = daysUntil(task.due_date, now)
  if (days < -1) return { urgency: 'overdue', label: `${-days} days overdue`, detail }
  if (days === -1) return { urgency: 'overdue', label: '1 day overdue', detail }
  if (days === 0) return { urgency: 'today', label: 'Due today', detail }
  if (days === 1) return { urgency: 'soon', label: 'Due tomorrow', detail }
  if (days <= SOON_DAYS) return { urgency: 'soon', label: `Due in ${days} days`, detail }
  return { urgency: 'none', label: date, detail }
}

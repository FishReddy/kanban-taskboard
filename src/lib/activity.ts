import { COLUMNS, formatDueDate, PRIORITY_LABELS } from './board'
import type { TaskActivity, TaskPriority, TaskStatus } from './types'

/** Turns a history entry into the sentence shown on the timeline. */
export function describeActivity(entry: TaskActivity, now = new Date()): string {
  const from = entry.from_value ?? ''
  const to = entry.to_value ?? ''

  switch (entry.action) {
    case 'created':
      return 'Created this task'
    case 'status':
      return `Moved from ${COLUMNS[from as TaskStatus].title} → ${COLUMNS[to as TaskStatus].title}`
    case 'title':
      return `Renamed from “${from}” to “${to}”`
    case 'description':
      return 'Updated the description'
    case 'priority':
      if (from === 'none') return `Set the priority to ${PRIORITY_LABELS[to as TaskPriority]}`
      if (to === 'none') return 'Removed the priority'
      return `Changed priority from ${PRIORITY_LABELS[from as TaskPriority]} to ${PRIORITY_LABELS[to as TaskPriority]}`
    case 'due_date':
      if (!from) return `Set the due date to ${formatDueDate(to, now)}`
      if (!to) return 'Removed the due date'
      return `Changed the due date from ${formatDueDate(from, now)} to ${formatDueDate(to, now)}`
    case 'assigned':
      return `Assigned ${to}`
    case 'unassigned':
      return `Unassigned ${from}`
    case 'labeled':
      return `Added the label ${to}`
    case 'unlabeled':
      return `Removed the label ${from}`
  }
}

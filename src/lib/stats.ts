import { getDueInfo } from './due'
import type { Task } from './types'

export interface BoardStatValues {
  total: number
  completed: number
  overdue: number
}

/** Counts across the whole board. Finished work is never overdue. */
export function computeBoardStats(
  tasks: Pick<Task, 'status' | 'due_date'>[],
  now = new Date(),
): BoardStatValues {
  return {
    total: tasks.length,
    completed: tasks.filter((task) => task.status === 'done').length,
    overdue: tasks.filter((task) => getDueInfo(task, now)?.urgency === 'overdue').length,
  }
}

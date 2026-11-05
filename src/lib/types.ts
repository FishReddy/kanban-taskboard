export const STATUSES = ['todo', 'in_progress', 'in_review', 'done'] as const
export type TaskStatus = (typeof STATUSES)[number]

export const PRIORITIES = ['low', 'normal', 'high'] as const
export type TaskPriority = (typeof PRIORITIES)[number]

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  /** Calendar date as YYYY-MM-DD, with no time zone. */
  due_date: string | null
  position: number
  user_id: string
  created_at: string
  updated_at: string
}

/** The fields a person edits directly in the task form. */
export type TaskDraft = Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'due_date'>

export function isTaskStatus(value: unknown): value is TaskStatus {
  return STATUSES.includes(value as TaskStatus)
}

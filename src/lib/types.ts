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
  /** Team member ids, stored in the task_assignees table. */
  assignee_ids: string[]
  /** Label ids, stored in the task_labels table. */
  label_ids: string[]
}

/** The fields a person edits directly in the task form. */
export type TaskDraft = Pick<
  Task,
  'title' | 'description' | 'status' | 'priority' | 'due_date' | 'assignee_ids' | 'label_ids'
>

export interface TeamMember {
  id: string
  name: string
  color: string
  user_id: string
  created_at: string
}

/** The fields a person edits directly in the team form. */
export type TeamMemberDraft = Pick<TeamMember, 'name' | 'color'>

export interface Label {
  id: string
  name: string
  color: string
  user_id: string
  created_at: string
}

/** The fields a person edits directly in the labels form. */
export type LabelDraft = Pick<Label, 'name' | 'color'>

export interface TaskComment {
  id: string
  task_id: string
  body: string
  user_id: string
  created_at: string
}

export type ActivityAction =
  | 'created'
  | 'status'
  | 'title'
  | 'description'
  | 'priority'
  | 'due_date'
  | 'assigned'
  | 'unassigned'
  | 'labeled'
  | 'unlabeled'

/** A history entry, written only by database triggers. */
export interface TaskActivity {
  id: string
  task_id: string
  action: ActivityAction
  from_value: string | null
  to_value: string | null
  created_at: string
}

export function isTaskStatus(value: unknown): value is TaskStatus {
  return STATUSES.includes(value as TaskStatus)
}

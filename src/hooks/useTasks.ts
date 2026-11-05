import { useCallback, useEffect, useState } from 'react'
import { topPosition } from '../lib/board'
import { supabase } from '../lib/supabase'
import type { Task, TaskDraft, TaskStatus } from '../lib/types'
import type { EnqueueWrite } from './useWriteQueue'

const TASK_QUERY =
  'id, title, description, status, priority, due_date, position, user_id, created_at, updated_at, task_assignees(member_id)'

type TaskRow = Omit<Task, 'assignee_ids'> & { task_assignees: { member_id: string }[] }

/** The columns of the tasks table itself, which excludes assignees. */
type TaskPatch = Partial<Omit<TaskDraft, 'assignee_ids'> & Pick<Task, 'position'>>

export type LoadState = { status: 'loading' } | { status: 'ready' } | { status: 'error'; message: string }

function toTask({ task_assignees, ...row }: TaskRow): Task {
  return { ...row, assignee_ids: task_assignees.map((assignee) => assignee.member_id) }
}

/**
 * Loads the signed-in user's tasks and keeps the board optimistic: every change
 * shows immediately and is undone with a message if the write fails. Access
 * control is RLS's job, so queries don't filter by user.
 */
export function useTasks(userId: string, enqueueWrite: EnqueueWrite) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoadState({ status: 'loading' })
    supabase
      .from('tasks')
      .select(TASK_QUERY)
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.error('Failed to load tasks:', error.message)
          setLoadState({
            status: 'error',
            message: 'Something went wrong while fetching your tasks. Check your connection and try again.',
          })
        } else {
          setTasks((data as unknown as TaskRow[]).map(toTask))
          setLoadState({ status: 'ready' })
        }
      })
    return () => {
      cancelled = true
    }
  }, [userId, attempt])

  const reload = useCallback(() => setAttempt((count) => count + 1), [])

  function createTask(draft: TaskDraft) {
    const now = new Date().toISOString()
    // The id is generated here so that edits or moves made before the insert
    // finishes can already refer to the row.
    const task: Task = {
      ...draft,
      id: crypto.randomUUID(),
      position: topPosition(tasks, draft.status),
      user_id: userId,
      created_at: now,
      updated_at: now,
    }
    let inserted = true
    setTasks((current) => [...current, task])
    enqueueWrite(
      () =>
        supabase.from('tasks').insert({
          id: task.id,
          user_id: task.user_id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          due_date: task.due_date,
          position: task.position,
        }),
      () => {
        inserted = false
        setTasks((current) => current.filter((t) => t.id !== task.id))
      },
      `Couldn't save "${task.title}". Please try again.`,
    )
    if (draft.assignee_ids.length > 0) {
      enqueueWrite(
        async () => (inserted ? insertAssignees(task.id, draft.assignee_ids) : { error: null }),
        () => setTasks((current) => current.map((t) => (t.id === task.id ? { ...t, assignee_ids: [] } : t))),
        `"${task.title}" was saved, but its assignees weren't.`,
      )
    }
  }

  function insertAssignees(taskId: string, memberIds: string[]) {
    return supabase
      .from('task_assignees')
      .insert(memberIds.map((member_id) => ({ task_id: taskId, member_id, user_id: userId })))
  }

  function updateTask(id: string, patch: TaskPatch) {
    const previous = tasks.find((t) => t.id === id)
    if (!previous) return
    setTasks((current) => current.map((t) => (t.id === id ? { ...t, ...patch } : t)))
    enqueueWrite(
      // Selecting the row back turns an update that matched nothing (for
      // example, one RLS filtered out) into an error instead of a silent no-op.
      () => supabase.from('tasks').update(patch).eq('id', id).select('id').single(),
      () =>
        setTasks((current) =>
          current.map((t) => (t.id === id ? { ...previous, assignee_ids: t.assignee_ids } : t)),
        ),
      `Couldn't update "${previous.title}". Your change was undone.`,
    )
  }

  function updateAssignees(task: Task, nextIds: string[]) {
    const added = nextIds.filter((id) => !task.assignee_ids.includes(id))
    const removed = task.assignee_ids.filter((id) => !nextIds.includes(id))
    if (added.length === 0 && removed.length === 0) return

    const setIds = (ids: string[]) =>
      setTasks((current) => current.map((t) => (t.id === task.id ? { ...t, assignee_ids: ids } : t)))

    setIds(nextIds)
    enqueueWrite(
      async () => {
        if (removed.length > 0) {
          const result = await supabase
            .from('task_assignees')
            .delete()
            .eq('task_id', task.id)
            .in('member_id', removed)
          if (result.error) return result
        }
        return added.length > 0 ? insertAssignees(task.id, added) : { error: null }
      },
      () => setIds(task.assignee_ids),
      `Couldn't update the assignees on "${task.title}". Your change was undone.`,
    )
  }

  /** Applies form edits. A status change puts the task at the top of its new column. */
  function editTask(id: string, { assignee_ids, ...fields }: TaskDraft) {
    const previous = tasks.find((t) => t.id === id)
    if (!previous) return

    const isTaskChanged = (Object.keys(fields) as (keyof typeof fields)[]).some(
      (key) => fields[key] !== previous[key],
    )
    if (isTaskChanged) {
      const movedColumn = previous.status !== fields.status
      updateTask(id, movedColumn ? { ...fields, position: topPosition(tasks, fields.status) } : fields)
    }
    updateAssignees(previous, assignee_ids)
  }

  function moveTask(id: string, status: TaskStatus, position: number) {
    updateTask(id, { status, position })
  }

  function deleteTask(id: string) {
    const previous = tasks.find((t) => t.id === id)
    if (!previous) return
    setTasks((current) => current.filter((t) => t.id !== id))
    enqueueWrite(
      () => supabase.from('tasks').delete().eq('id', id),
      () => setTasks((current) => [...current, previous]),
      `Couldn't delete "${previous.title}". It has been restored.`,
    )
  }

  return { tasks, loadState, reload, createTask, editTask, moveTask, deleteTask }
}

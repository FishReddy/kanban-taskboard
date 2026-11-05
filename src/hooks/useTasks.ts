import { useCallback, useEffect, useRef, useState } from 'react'
import { topPosition } from '../lib/board'
import { supabase } from '../lib/supabase'
import type { Task, TaskDraft, TaskStatus } from '../lib/types'

const TASK_COLUMNS = 'id, title, description, status, priority, due_date, position, user_id, created_at, updated_at'

type LoadState = { status: 'loading' } | { status: 'ready' } | { status: 'error'; message: string }

/**
 * Loads the signed-in user's tasks and keeps the board optimistic: every change
 * shows immediately, is written in order, and is undone with a message if the
 * write fails. Access control is RLS's job, so queries don't filter by user.
 */
export function useTasks(userId: string, onError: (message: string) => void) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  // Writes run one at a time so quick successive moves can't land out of order.
  const writeQueue = useRef<Promise<void>>(Promise.resolve())

  useEffect(() => {
    let cancelled = false
    setLoadState({ status: 'loading' })
    supabase
      .from('tasks')
      .select(TASK_COLUMNS)
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.error('Failed to load tasks:', error.message)
          setLoadState({
            status: 'error',
            message: 'Something went wrong while fetching your tasks. Check your connection and try again.',
          })
        } else {
          setTasks(data as Task[])
          setLoadState({ status: 'ready' })
        }
      })
    return () => {
      cancelled = true
    }
  }, [userId, attempt])

  const reload = useCallback(() => setAttempt((count) => count + 1), [])

  function enqueueWrite(
    write: () => PromiseLike<{ error: { message: string } | null }>,
    rollback: () => void,
    failureMessage: string,
  ) {
    writeQueue.current = writeQueue.current.then(async () => {
      let failed: boolean
      try {
        failed = (await write()).error !== null
      } catch {
        failed = true
      }
      if (failed) {
        rollback()
        onError(failureMessage)
      }
    })
  }

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
      () => setTasks((current) => current.filter((t) => t.id !== task.id)),
      `Couldn't save "${task.title}". Please try again.`,
    )
  }

  function updateTask(id: string, patch: Partial<TaskDraft & Pick<Task, 'position'>>) {
    const previous = tasks.find((t) => t.id === id)
    if (!previous) return
    setTasks((current) => current.map((t) => (t.id === id ? { ...t, ...patch } : t)))
    enqueueWrite(
      // Selecting the row back turns an update that matched nothing (for
      // example, one RLS filtered out) into an error instead of a silent no-op.
      () => supabase.from('tasks').update(patch).eq('id', id).select('id').single(),
      () => setTasks((current) => current.map((t) => (t.id === id ? previous : t))),
      `Couldn't update "${previous.title}". Your change was undone.`,
    )
  }

  /** Applies form edits. A status change puts the task at the top of its new column. */
  function editTask(id: string, draft: TaskDraft) {
    const previous = tasks.find((t) => t.id === id)
    if (!previous) return
    const movedColumn = previous.status !== draft.status
    updateTask(id, movedColumn ? { ...draft, position: topPosition(tasks, draft.status) } : draft)
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

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { TaskActivity } from '../lib/types'
import type { LoadState } from './useTasks'

const ACTIVITY_COLUMNS = 'id, task_id, action, from_value, to_value, created_at'

/**
 * Loads one task's history, newest first. Unlike comments this isn't kept in
 * memory, because the database writes entries and only it knows what they are.
 * Each opening of the Activity tab fetches a fresh copy, after waiting for any
 * queued writes so that a change saved a moment ago is included.
 */
export function useTaskActivity(taskId: string, whenSettled: () => Promise<void>) {
  const [entries, setEntries] = useState<TaskActivity[]>([])
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoadState({ status: 'loading' })
    whenSettled()
      .then(() =>
        supabase
          .from('task_activity')
          .select(ACTIVITY_COLUMNS)
          .eq('task_id', taskId)
          .order('created_at', { ascending: false }),
      )
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.error('Failed to load activity:', error.message)
          setLoadState({
            status: 'error',
            message: "We couldn't load this task's history. Check your connection and try again.",
          })
        } else {
          setEntries(data as TaskActivity[])
          setLoadState({ status: 'ready' })
        }
      })
    return () => {
      cancelled = true
    }
  }, [taskId, whenSettled, attempt])

  const reload = useCallback(() => setAttempt((count) => count + 1), [])

  return { entries, loadState, reload }
}

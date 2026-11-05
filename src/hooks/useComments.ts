import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { TaskComment } from '../lib/types'
import type { LoadState } from './useTasks'
import type { EnqueueWrite } from './useWriteQueue'

const COMMENT_COLUMNS = 'id, task_id, body, user_id, created_at'

/**
 * Loads the signed-in user's comments up front, which gives cards their counts
 * and lets a task's comments open instantly. Deleting a task removes its
 * comments in the database. They stay in local state, which is harmless because
 * nothing shows them, and a failed delete brings them back without extra work.
 */
export function useComments(userId: string, enqueueWrite: EnqueueWrite) {
  const [comments, setComments] = useState<TaskComment[]>([])
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoadState({ status: 'loading' })
    supabase
      .from('comments')
      .select(COMMENT_COLUMNS)
      .order('created_at')
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.error('Failed to load comments:', error.message)
          setLoadState({
            status: 'error',
            message: 'Something went wrong while fetching your comments. Check your connection and try again.',
          })
        } else {
          setComments(data as TaskComment[])
          setLoadState({ status: 'ready' })
        }
      })
    return () => {
      cancelled = true
    }
  }, [userId, attempt])

  const reload = useCallback(() => setAttempt((count) => count + 1), [])

  function addComment(taskId: string, body: string, onFailure?: () => void) {
    const comment: TaskComment = {
      id: crypto.randomUUID(),
      task_id: taskId,
      body,
      user_id: userId,
      created_at: new Date().toISOString(),
    }
    setComments((current) => [...current, comment])
    enqueueWrite(
      () =>
        supabase
          .from('comments')
          .insert({ id: comment.id, task_id: taskId, user_id: userId, body }),
      () => {
        setComments((current) => current.filter((c) => c.id !== comment.id))
        onFailure?.()
      },
      "Couldn't post your comment. Please try again.",
    )
  }

  function deleteComment(id: string, onFailure?: () => void) {
    const previous = comments.find((c) => c.id === id)
    if (!previous) return
    setComments((current) => current.filter((c) => c.id !== id))
    enqueueWrite(
      () => supabase.from('comments').delete().eq('id', id).select('id').single(),
      () => {
        setComments((current) => [...current, previous])
        onFailure?.()
      },
      "Couldn't delete that comment. It has been restored.",
    )
  }

  return { comments, loadState, reload, addComment, deleteComment }
}

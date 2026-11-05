import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Label, LabelDraft } from '../lib/types'
import type { LoadState } from './useTasks'
import type { EnqueueWrite } from './useWriteQueue'

const LABEL_COLUMNS = 'id, name, color, user_id, created_at'

/** Loads and edits the signed-in user's labels, optimistically like tasks. */
export function useLabels(userId: string, enqueueWrite: EnqueueWrite) {
  const [labels, setLabels] = useState<Label[]>([])
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoadState({ status: 'loading' })
    supabase
      .from('labels')
      .select(LABEL_COLUMNS)
      .order('created_at')
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.error('Failed to load labels:', error.message)
          setLoadState({
            status: 'error',
            message: 'Something went wrong while fetching your labels. Check your connection and try again.',
          })
        } else {
          setLabels(data as Label[])
          setLoadState({ status: 'ready' })
        }
      })
    return () => {
      cancelled = true
    }
  }, [userId, attempt])

  const reload = useCallback(() => setAttempt((count) => count + 1), [])

  function addLabel(draft: LabelDraft) {
    const label: Label = {
      ...draft,
      id: crypto.randomUUID(),
      user_id: userId,
      created_at: new Date().toISOString(),
    }
    setLabels((current) => [...current, label])
    enqueueWrite(
      () =>
        supabase
          .from('labels')
          .insert({ id: label.id, user_id: label.user_id, name: label.name, color: label.color }),
      () => setLabels((current) => current.filter((l) => l.id !== label.id)),
      `Couldn't add the ${label.name} label. Please try again.`,
    )
  }

  function updateLabel(id: string, draft: LabelDraft) {
    const previous = labels.find((l) => l.id === id)
    if (!previous) return
    setLabels((current) => current.map((l) => (l.id === id ? { ...l, ...draft } : l)))
    enqueueWrite(
      () => supabase.from('labels').update(draft).eq('id', id).select('id').single(),
      () => setLabels((current) => current.map((l) => (l.id === id ? previous : l))),
      `Couldn't update the ${previous.name} label. Your change was undone.`,
    )
  }

  /**
   * The database removes the label from its tasks too. Tasks keep the stale id
   * locally, which is harmless because display skips unknown labels, and it
   * means a failed delete restores the label everywhere without extra work.
   */
  function removeLabel(id: string) {
    const previous = labels.find((l) => l.id === id)
    if (!previous) return
    setLabels((current) => current.filter((l) => l.id !== id))
    enqueueWrite(
      () => supabase.from('labels').delete().eq('id', id),
      () =>
        setLabels((current) =>
          [...current, previous].sort((a, b) => a.created_at.localeCompare(b.created_at)),
        ),
      `Couldn't delete the ${previous.name} label. It has been restored.`,
    )
  }

  return { labels, loadState, reload, addLabel, updateLabel, removeLabel }
}

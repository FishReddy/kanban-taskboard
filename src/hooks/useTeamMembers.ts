import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { TeamMember, TeamMemberDraft } from '../lib/types'
import type { LoadState } from './useTasks'
import type { EnqueueWrite } from './useWriteQueue'

const MEMBER_COLUMNS = 'id, name, color, user_id, created_at'

/** Loads and edits the signed-in user's team, optimistically like tasks. */
export function useTeamMembers(userId: string, enqueueWrite: EnqueueWrite) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoadState({ status: 'loading' })
    supabase
      .from('team_members')
      .select(MEMBER_COLUMNS)
      .order('created_at')
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.error('Failed to load team:', error.message)
          setLoadState({
            status: 'error',
            message: 'Something went wrong while fetching your team. Check your connection and try again.',
          })
        } else {
          setMembers(data as TeamMember[])
          setLoadState({ status: 'ready' })
        }
      })
    return () => {
      cancelled = true
    }
  }, [userId, attempt])

  const reload = useCallback(() => setAttempt((count) => count + 1), [])

  function addMember(draft: TeamMemberDraft) {
    const member: TeamMember = {
      ...draft,
      id: crypto.randomUUID(),
      user_id: userId,
      created_at: new Date().toISOString(),
    }
    setMembers((current) => [...current, member])
    enqueueWrite(
      () =>
        supabase
          .from('team_members')
          .insert({ id: member.id, user_id: member.user_id, name: member.name, color: member.color }),
      () => setMembers((current) => current.filter((m) => m.id !== member.id)),
      `Couldn't add ${member.name} to the team. Please try again.`,
    )
  }

  function updateMember(id: string, draft: TeamMemberDraft) {
    const previous = members.find((m) => m.id === id)
    if (!previous) return
    setMembers((current) => current.map((m) => (m.id === id ? { ...m, ...draft } : m)))
    enqueueWrite(
      () => supabase.from('team_members').update(draft).eq('id', id).select('id').single(),
      () => setMembers((current) => current.map((m) => (m.id === id ? previous : m))),
      `Couldn't update ${previous.name}. Your change was undone.`,
    )
  }

  /**
   * The database removes the member's assignments too. Tasks keep the stale id
   * locally, which is harmless because display skips unknown members, and it
   * means a failed removal restores every assignment without extra work.
   */
  function removeMember(id: string) {
    const previous = members.find((m) => m.id === id)
    if (!previous) return
    setMembers((current) => current.filter((m) => m.id !== id))
    enqueueWrite(
      () => supabase.from('team_members').delete().eq('id', id),
      () =>
        setMembers((current) =>
          [...current, previous].sort((a, b) => a.created_at.localeCompare(b.created_at)),
        ),
      `Couldn't remove ${previous.name}. They have been restored.`,
    )
  }

  return { members, loadState, reload, addMember, updateMember, removeMember }
}

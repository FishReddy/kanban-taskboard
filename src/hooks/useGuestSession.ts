import { useCallback, useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

type GuestSession =
  | { status: 'loading' }
  | { status: 'ready'; userId: string }
  | { status: 'error'; message: string }

// Shared across calls so that React StrictMode's double-run of effects, or any
// other concurrent caller, can't create two guest users on first launch.
let pending: Promise<string> | null = null

function ensureGuestUser(): Promise<string> {
  pending ??= (async () => {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    if (data.session) return data.session.user.id

    const created = await supabase.auth.signInAnonymously()
    if (created.error) throw created.error
    if (!created.data.user) throw new Error('Supabase did not return a guest user.')
    return created.data.user.id
  })().catch((error) => {
    pending = null // Allow a retry after a failure.
    throw error
  })
  return pending
}

/** Restores this browser's guest session, creating one on first launch. */
export function useGuestSession() {
  const [session, setSession] = useState<GuestSession>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setSession({
        status: 'error',
        message: 'This deployment is missing its Supabase environment variables.',
      })
      return
    }

    let cancelled = false
    setSession({ status: 'loading' })
    ensureGuestUser()
      .then((userId) => {
        if (!cancelled) setSession({ status: 'ready', userId })
      })
      .catch((error: Error) => {
        if (!cancelled) setSession({ status: 'error', message: error.message })
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  const retry = useCallback(() => setAttempt((count) => count + 1), [])
  return { session, retry }
}

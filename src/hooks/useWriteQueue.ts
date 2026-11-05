import { useCallback, useRef } from 'react'

type WriteResult = { error: { message: string } | null }

export type EnqueueWrite = (
  write: () => PromiseLike<WriteResult>,
  rollback: () => void,
  failureMessage: string,
) => void

/**
 * Runs database writes one at a time, so quick successive changes can't land
 * out of order. For example, assigning a member right after creating them
 * always inserts the member first. A failed write is rolled back and reported.
 */
export function useWriteQueue(onError: (message: string) => void) {
  const queue = useRef<Promise<void>>(Promise.resolve())

  const enqueueWrite = useCallback<EnqueueWrite>(
    (write, rollback, failureMessage) => {
      queue.current = queue.current.then(async () => {
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
    },
    [onError],
  )

  /** Resolves once every write queued so far has finished. Never rejects. */
  const whenSettled = useCallback(() => queue.current, [])

  return { enqueueWrite, whenSettled }
}

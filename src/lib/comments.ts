import type { TaskComment } from './types'

export const COMMENT_MAX = 2000

export type CommentsByTask = ReadonlyMap<string, TaskComment[]>

/** Groups comments by task, oldest first within each task. */
export function groupCommentsByTask(comments: TaskComment[]): CommentsByTask {
  const grouped = new Map<string, TaskComment[]>()
  for (const comment of comments) {
    const list = grouped.get(comment.task_id)
    if (list) list.push(comment)
    else grouped.set(comment.task_id, [comment])
  }
  for (const list of grouped.values()) {
    list.sort((a, b) => a.created_at.localeCompare(b.created_at))
  }
  return grouped
}

export function describeCommentCount(count: number): string {
  return count === 1 ? '1 comment' : `${count} comments`
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/**
 * "just now", "5 minutes ago" and so on for the past week, then a date. A
 * timestamp slightly in the future, from clock differences, reads as just now.
 */
export function formatRelativeTime(timestamp: string, now = new Date(), locale?: string): string {
  const then = new Date(timestamp)
  const elapsed = now.getTime() - then.getTime()
  if (elapsed < MINUTE) return 'just now'

  const relative = new Intl.RelativeTimeFormat(locale)
  if (elapsed < HOUR) return relative.format(-Math.floor(elapsed / MINUTE), 'minute')
  if (elapsed < DAY) return relative.format(-Math.floor(elapsed / HOUR), 'hour')
  if (elapsed < 7 * DAY) return relative.format(-Math.floor(elapsed / DAY), 'day')

  return then.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    ...(then.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }),
  })
}

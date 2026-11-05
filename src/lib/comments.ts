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

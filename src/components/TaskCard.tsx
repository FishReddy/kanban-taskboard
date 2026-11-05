import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, MessageSquare } from 'lucide-react'
import { formatDueDate, PRIORITY_LABELS } from '../lib/board'
import { describeCommentCount, type CommentsByTask } from '../lib/comments'
import { resolveMembers } from '../lib/team'
import type { Task, TeamMember } from '../lib/types'
import { AvatarStack } from './Avatar'

export type MembersById = ReadonlyMap<string, TeamMember>

interface TaskCardProps {
  task: Task
  membersById: MembersById
  commentsByTask: CommentsByTask
  isOverlay?: boolean
}

export function TaskCard({ task, membersById, commentsByTask, isOverlay = false }: TaskCardProps) {
  const assignees = resolveMembers(task.assignee_ids, membersById)
  const commentCount = commentsByTask.get(task.id)?.length ?? 0
  const hasMeta =
    task.priority !== 'normal' || task.due_date || assignees.length > 0 || commentCount > 0

  return (
    <article
      className={`card${isOverlay ? ' card--overlay' : ''}${task.status === 'done' ? ' card--done' : ''}`}
    >
      <h3 className="card__title">{task.title}</h3>
      {task.description && <p className="card__description">{task.description}</p>}
      {hasMeta && (
        <div className="card__meta">
          {task.priority !== 'normal' && (
            <span className={`priority priority--${task.priority}`}>
              <span className="priority__bars" aria-hidden>
                <i />
                <i />
                <i />
              </span>
              {PRIORITY_LABELS[task.priority]}
            </span>
          )}
          {task.due_date && (
            <span className="card__due">
              <Calendar size={12} aria-hidden />
              {formatDueDate(task.due_date)}
            </span>
          )}
          {commentCount > 0 && (
            <span className="card__comments" title={describeCommentCount(commentCount)}>
              <MessageSquare size={12} aria-hidden />
              {commentCount}
            </span>
          )}
          {assignees.length > 0 && (
            <span className="card__assignees">
              <AvatarStack members={assignees} size="small" />
            </span>
          )}
        </div>
      )}
    </article>
  )
}

interface SortableTaskCardProps {
  task: Task
  membersById: MembersById
  commentsByTask: CommentsByTask
  onOpen: (id: string) => void
}

export function SortableTaskCard({ task, membersById, commentsByTask, onOpen }: SortableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })
  const assigneeNames = resolveMembers(task.assignee_ids, membersById).map((member) => member.name)
  const assignedTo = assigneeNames.length > 0 ? ` Assigned to ${assigneeNames.join(', ')}.` : ''
  const commentCount = commentsByTask.get(task.id)?.length ?? 0
  const commented = commentCount > 0 ? ` ${describeCommentCount(commentCount)}.` : ''

  return (
    <div
      ref={setNodeRef}
      className={`card-slot${isDragging ? ' card-slot--dragging' : ''}`}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
      aria-label={`${task.title}.${assignedTo}${commented} Press Enter to open, Space to pick up and move.`}
      onClick={() => onOpen(task.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && !isDragging) {
          // Without this, the same keypress lands on the dialog's newly focused
          // title field and submits the form, closing it straight away.
          event.preventDefault()
          onOpen(task.id)
        }
        listeners?.onKeyDown?.(event)
      }}
    >
      <TaskCard task={task} membersById={membersById} commentsByTask={commentsByTask} />
    </div>
  )
}

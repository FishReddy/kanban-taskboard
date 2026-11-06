import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AlertCircle, Calendar, Clock, MessageSquare } from 'lucide-react'
import type { ReactNode } from 'react'
import { PRIORITY_LABELS } from '../lib/board'
import { describeCommentCount, type CommentsByTask } from '../lib/comments'
import { getDueInfo, type DueUrgency } from '../lib/due'
import { resolveLabels } from '../lib/labels'
import { resolveMembers } from '../lib/team'
import type { Label, Task, TeamMember } from '../lib/types'
import { AvatarStack } from './Avatar'
import { LabelPill } from './LabelPill'

const MAX_CARD_LABELS = 3

/** Urgency is carried by the icon and wording as well as the colour. */
const DUE_ICONS: Record<DueUrgency, ReactNode> = {
  overdue: <AlertCircle size={12} aria-hidden />,
  today: <Clock size={12} aria-hidden />,
  soon: <Clock size={12} aria-hidden />,
  none: <Calendar size={12} aria-hidden />,
}

/** What a card looks up beyond the task itself. */
export interface CardData {
  membersById: ReadonlyMap<string, TeamMember>
  labelsById: ReadonlyMap<string, Label>
  commentsByTask: CommentsByTask
}

interface TaskCardProps {
  task: Task
  data: CardData
  isOverlay?: boolean
}

export function TaskCard({ task, data, isOverlay = false }: TaskCardProps) {
  const assignees = resolveMembers(task.assignee_ids, data.membersById)
  const labels = resolveLabels(task.label_ids, data.labelsById)
  const commentCount = data.commentsByTask.get(task.id)?.length ?? 0
  const due = getDueInfo(task)
  const hasMeta =
    task.priority !== 'none' || task.due_date || assignees.length > 0 || commentCount > 0

  return (
    <article
      className={`card${isOverlay ? ' card--overlay' : ''}${task.status === 'done' ? ' card--done' : ''}`}
    >
      {labels.length > 0 && (
        <div className="card__labels">
          {labels.slice(0, MAX_CARD_LABELS).map((label) => (
            <LabelPill key={label.id} label={label} />
          ))}
          {labels.length > MAX_CARD_LABELS && (
            <span className="card__labels-more">+{labels.length - MAX_CARD_LABELS}</span>
          )}
        </div>
      )}
      <h3 className="card__title">{task.title}</h3>
      {task.description && <p className="card__description">{task.description}</p>}
      {hasMeta && (
        <div className="card__meta">
          {task.priority !== 'none' && (
            <span className={`priority priority--${task.priority}`}>
              <span className="priority__bars" aria-hidden>
                <i />
                <i />
                <i />
              </span>
              {PRIORITY_LABELS[task.priority]}
            </span>
          )}
          {due && (
            <span className={`due due--${due.urgency}`} title={due.detail}>
              {DUE_ICONS[due.urgency]}
              {due.label}
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
  data: CardData
  onOpen: (id: string) => void
}

export function SortableTaskCard({ task, data, onOpen }: SortableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })
  const assigneeNames = resolveMembers(task.assignee_ids, data.membersById).map((member) => member.name)
  const assignedTo = assigneeNames.length > 0 ? ` Assigned to ${assigneeNames.join(', ')}.` : ''
  const labelNames = resolveLabels(task.label_ids, data.labelsById).map((label) => label.name)
  const labelled = labelNames.length > 0 ? ` Labels: ${labelNames.join(', ')}.` : ''
  const commentCount = data.commentsByTask.get(task.id)?.length ?? 0
  const commented = commentCount > 0 ? ` ${describeCommentCount(commentCount)}.` : ''
  const dueInfo = getDueInfo(task)
  const dueText = dueInfo
    ? ` ${dueInfo.urgency === 'none' ? dueInfo.detail : `${dueInfo.label}, ${dueInfo.detail}`}.`
    : ''

  return (
    <div
      ref={setNodeRef}
      className={`card-slot${isDragging ? ' card-slot--dragging' : ''}`}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
      aria-label={`${task.title}.${dueText}${assignedTo}${labelled}${commented} Press Enter to open, Space to pick up and move.`}
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
      <TaskCard task={task} data={data} />
    </div>
  )
}

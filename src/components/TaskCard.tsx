import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar } from 'lucide-react'
import { formatDueDate, PRIORITY_LABELS } from '../lib/board'
import type { Task } from '../lib/types'

export function TaskCard({ task, isOverlay = false }: { task: Task; isOverlay?: boolean }) {
  return (
    <article
      className={`card${isOverlay ? ' card--overlay' : ''}${task.status === 'done' ? ' card--done' : ''}`}
    >
      <h3 className="card__title">{task.title}</h3>
      {task.description && <p className="card__description">{task.description}</p>}
      {(task.priority !== 'normal' || task.due_date) && (
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
        </div>
      )}
    </article>
  )
}

export function SortableTaskCard({ task, onOpen }: { task: Task; onOpen: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  return (
    <div
      ref={setNodeRef}
      className={`card-slot${isDragging ? ' card-slot--dragging' : ''}`}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
      aria-label={`${task.title}. Press Enter to open, Space to pick up and move.`}
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
      <TaskCard task={task} />
    </div>
  )
}

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { useMemo } from 'react'
import { COLUMNS } from '../lib/board'
import type { Task, TaskStatus } from '../lib/types'
import { SortableTaskCard, type CardData } from './TaskCard'

interface ColumnProps {
  status: TaskStatus
  tasks: Task[]
  cardData: CardData
  isFiltered: boolean
  onOpenTask: (id: string) => void
  onAddTask: (status: TaskStatus) => void
}

export function Column({ status, tasks, cardData, isFiltered, onOpenTask, onAddTask }: ColumnProps) {
  const { title, emptyHint } = COLUMNS[status]
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const taskIds = useMemo(() => tasks.map((task) => task.id), [tasks])

  return (
    <section className="column" data-status={status} aria-label={title}>
      <header className="column__header">
        <span className="column__dot" aria-hidden />
        <h2 className="column__title">{title}</h2>
        <span className="column__count">{tasks.length}</span>
        <button
          type="button"
          className="icon-button icon-button--small column__add"
          onClick={() => onAddTask(status)}
          aria-label={`Add task to ${title}`}
        >
          <Plus size={15} aria-hidden />
        </button>
      </header>

      <div ref={setNodeRef} className={`column__body${isOver ? ' column__body--over' : ''}`}>
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              data={cardData}
              onOpen={onOpenTask}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="column__empty">
            <p>{isFiltered ? 'No matching tasks here.' : emptyHint}</p>
            {status === 'todo' && !isFiltered && (
              <button type="button" className="button button--ghost" onClick={() => onAddTask(status)}>
                <Plus size={14} aria-hidden />
                Add a task
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

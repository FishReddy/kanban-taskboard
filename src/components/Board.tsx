import {
  closestCenter,
  defaultDropAnimationSideEffects,
  DndContext,
  DragOverlay,
  getFirstCollision,
  KeyboardSensor,
  MeasuringStrategy,
  MouseSensor,
  pointerWithin,
  rectIntersection,
  TouchSensor,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type DropAnimation,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useCallback, useMemo, useRef, useState } from 'react'
import { groupByStatus, positionBetween, type TasksByStatus } from '../lib/board'
import { isTaskStatus, STATUSES, type Task, type TaskStatus } from '../lib/types'
import { Column } from './Column'
import { TaskCard, type CardData } from './TaskCard'

const dropAnimation: DropAnimation = {
  duration: 180,
  easing: 'cubic-bezier(0.2, 0, 0, 1)',
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: '0.4' } },
  }),
}

/** A droppable id is either a column's status or a task id within a column. */
function findColumn(id: string, columns: TasksByStatus): TaskStatus | undefined {
  if (isTaskStatus(id)) return id
  return STATUSES.find((status) => columns[status].some((task) => task.id === id))
}

interface BoardProps {
  tasks: Task[]
  cardData: CardData
  isFiltered: boolean
  onMoveTask: (id: string, status: TaskStatus, position: number) => void
  onOpenTask: (id: string) => void
  onAddTask: (status: TaskStatus) => void
}

export function Board({
  tasks,
  cardData,
  isFiltered,
  onMoveTask,
  onOpenTask,
  onAddTask,
}: BoardProps) {
  const saved = useMemo(() => groupByStatus(tasks), [tasks])

  // While dragging, the layout follows this local copy. Nothing is saved until drop.
  const [preview, setPreview] = useState<TasksByStatus | null>(null)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const columns = preview ?? saved

  const columnsRef = useRef(columns)
  columnsRef.current = columns

  const sensors = useSensors(
    // The small distance lets a plain click still open the task.
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    // The hold lets a swipe on a touch screen still scroll the board.
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      // Enter is left free to open the focused task.
      keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space', 'Enter'] },
    }),
  )

  // Finds the column under the pointer, then the closest card within it, so
  // that the tall gaps in a column still resolve to a specific slot.
  const collisionDetection = useCallback<CollisionDetection>((args) => {
    const pointerHits = pointerWithin(args)
    const hits = pointerHits.length > 0 ? pointerHits : rectIntersection(args)
    const overId = getFirstCollision(hits, 'id')
    if (overId === null) return []

    if (isTaskStatus(overId)) {
      const cardIds = new Set(columnsRef.current[overId].map((task) => task.id))
      if (cardIds.size > 0) {
        const closest = closestCenter({
          ...args,
          droppableContainers: args.droppableContainers.filter((container) =>
            cardIds.has(String(container.id)),
          ),
        })
        if (closest.length > 0) return closest
      }
    }
    return [{ id: overId }]
  }, [])

  function handleDragStart({ active }: DragStartEvent) {
    setActiveTask(tasks.find((task) => task.id === active.id) ?? null)
    setPreview(saved)
  }

  // Moves the card into a new column as soon as it crosses over. Reordering
  // within a column is animated by dnd-kit and resolved on drop.
  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) return
    setPreview((current) => {
      if (!current) return current
      const activeId = String(active.id)
      const overId = String(over.id)
      const from = findColumn(activeId, current)
      const to = findColumn(overId, current)
      if (!from || !to || from === to) return current

      const moving = current[from].find((task) => task.id === activeId)
      if (!moving) return current

      const overIndex = current[to].findIndex((task) => task.id === overId)
      const draggedTop = active.rect.current.translated?.top
      const isBelowOver = draggedTop !== undefined && draggedTop > over.rect.top + over.rect.height / 2
      const index = overIndex < 0 ? current[to].length : overIndex + (isBelowOver ? 1 : 0)

      return {
        ...current,
        [from]: current[from].filter((task) => task.id !== activeId),
        [to]: [...current[to].slice(0, index), moving, ...current[to].slice(index)],
      }
    })
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    const finalColumns = preview
    setActiveTask(null)
    setPreview(null)
    if (!over || !finalColumns) return

    const activeId = String(active.id)
    const status = findColumn(activeId, finalColumns)
    const original = tasks.find((task) => task.id === activeId)
    if (!status || !original) return

    let ordered = finalColumns[status]
    const fromIndex = ordered.findIndex((task) => task.id === activeId)
    const overIndex = ordered.findIndex((task) => task.id === over.id)
    if (overIndex >= 0 && overIndex !== fromIndex) {
      ordered = arrayMove(ordered, fromIndex, overIndex)
    }

    const index = ordered.findIndex((task) => task.id === activeId)
    const isUnchanged =
      original.status === status && saved[status].findIndex((task) => task.id === activeId) === index
    if (isUnchanged) return

    onMoveTask(
      activeId,
      status,
      positionBetween(ordered[index - 1]?.position, ordered[index + 1]?.position),
    )
  }

  function handleDragCancel() {
    setActiveTask(null)
    setPreview(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <main className="board">
        {STATUSES.map((status) => (
          <Column
            key={status}
            status={status}
            tasks={columns[status]}
            cardData={cardData}
            isFiltered={isFiltered}
            onOpenTask={onOpenTask}
            onAddTask={onAddTask}
          />
        ))}
      </main>
      <DragOverlay dropAnimation={dropAnimation}>
        {activeTask && <TaskCard task={activeTask} data={cardData} isOverlay />}
      </DragOverlay>
    </DndContext>
  )
}

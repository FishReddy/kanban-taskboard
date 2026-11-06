import { Tag, UserPlus } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { AvatarStack } from './components/Avatar'
import { Board } from './components/Board'
import { BoardSkeleton } from './components/BoardSkeleton'
import { ErrorState } from './components/ErrorState'
import { BoardFilters } from './components/BoardFilters'
import { Header } from './components/Header'
import { LabelsDialog } from './components/LabelsDialog'
import { TaskDialog } from './components/TaskDialog'
import { TeamDialog } from './components/TeamDialog'
import { Toast } from './components/Toast'
import { useComments } from './hooks/useComments'
import { useGuestSession } from './hooks/useGuestSession'
import { useLabels } from './hooks/useLabels'
import { useTasks } from './hooks/useTasks'
import { useTeamMembers } from './hooks/useTeamMembers'
import { useWriteQueue } from './hooks/useWriteQueue'
import { groupCommentsByTask } from './lib/comments'
import {
  hasActiveFilters,
  matchesFilters,
  newTaskValues,
  NO_FILTERS,
  pruneFilters,
  type BoardFilterValues,
} from './lib/filters'
import type { TaskStatus } from './lib/types'

export default function App() {
  const { session, retry } = useGuestSession()

  if (session.status === 'ready') return <Workspace userId={session.userId} />

  return (
    <div className="app">
      <Header />
      {session.status === 'loading' ? (
        <BoardSkeleton />
      ) : (
        <ErrorState
          title="We couldn't start your guest session"
          message={session.message}
          onRetry={retry}
        />
      )}
    </div>
  )
}

type DialogState =
  | { mode: 'closed' }
  | { mode: 'create'; status: TaskStatus }
  | { mode: 'edit'; taskId: string }
  | { mode: 'team' }
  | { mode: 'labels' }

function Workspace({ userId }: { userId: string }) {
  const [toast, setToast] = useState<string | null>(null)
  const [dialog, setDialog] = useState<DialogState>({ mode: 'closed' })
  const [filters, setFilters] = useState<BoardFilterValues>(NO_FILTERS)
  const { enqueueWrite, whenSettled } = useWriteQueue(setToast)
  const taskStore = useTasks(userId, enqueueWrite)
  const teamStore = useTeamMembers(userId, enqueueWrite)
  const labelStore = useLabels(userId, enqueueWrite)
  const commentStore = useComments(userId, enqueueWrite)
  const { tasks } = taskStore
  const { members } = teamStore
  const { labels } = labelStore
  const { comments } = commentStore

  const cardData = useMemo(
    () => ({
      membersById: new Map(members.map((member) => [member.id, member])),
      labelsById: new Map(labels.map((label) => [label.id, label])),
      commentsByTask: groupCommentsByTask(comments),
    }),
    [members, labels, comments],
  )
  const dismissToast = useCallback(() => setToast(null), [])
  const closeDialog = () => setDialog({ mode: 'closed' })

  // A deleted label or member can't keep filtering the board.
  const activeFilters = useMemo(
    () => pruneFilters(filters, cardData.membersById, cardData.labelsById),
    [filters, cardData.membersById, cardData.labelsById],
  )
  const visibleTasks = useMemo(
    () => tasks.filter((task) => matchesFilters(task, activeFilters, cardData.membersById)),
    [tasks, activeFilters, cardData.membersById],
  )

  const loadStates = [taskStore.loadState, teamStore.loadState, labelStore.loadState, commentStore.loadState]
  const failedLoad = loadStates.find((state) => state.status === 'error')
  const isReady = loadStates.every((state) => state.status === 'ready')

  const editingTask =
    dialog.mode === 'edit' ? tasks.find((task) => task.id === dialog.taskId) : undefined

  return (
    <div className="app">
      <Header onNewTask={isReady ? () => setDialog({ mode: 'create', status: 'todo' }) : undefined} />

      {failedLoad ? (
        <ErrorState
          title="We couldn't load your board"
          message={failedLoad.message}
          onRetry={() => {
            taskStore.reload()
            teamStore.reload()
            labelStore.reload()
            commentStore.reload()
          }}
        />
      ) : !isReady ? (
        <BoardSkeleton />
      ) : (
        <>
          <div className="toolbar">
            <BoardFilters
              filters={activeFilters}
              members={members}
              labels={labels}
              visibleCount={visibleTasks.length}
              totalCount={tasks.length}
              onChange={setFilters}
            />
            <div className="toolbar__actions">
              <button type="button" className="toolbar-button" onClick={() => setDialog({ mode: 'team' })}>
                {members.length > 0 ? (
                  <>
                    <AvatarStack members={members} max={5} size="small" />
                    Team
                  </>
                ) : (
                  <>
                    <UserPlus size={15} aria-hidden />
                    Add your team
                  </>
                )}
              </button>
              <button type="button" className="toolbar-button" onClick={() => setDialog({ mode: 'labels' })}>
                <Tag size={15} aria-hidden />
                Labels
              </button>
            </div>
          </div>
          <Board
            tasks={visibleTasks}
            cardData={cardData}
            isFiltered={hasActiveFilters(activeFilters)}
            onMoveTask={taskStore.moveTask}
            onOpenTask={(taskId) => setDialog({ mode: 'edit', taskId })}
            onAddTask={(status) => setDialog({ mode: 'create', status })}
          />
        </>
      )}

      {dialog.mode === 'create' && (
        <TaskDialog
          initialStatus={dialog.status}
          initialValues={newTaskValues(activeFilters)}
          members={members}
          labels={labels}
          onClose={closeDialog}
          onSave={(draft) => {
            taskStore.createTask(draft)
            // Someone who just made a task should be able to see it.
            if (!matchesFilters(draft, activeFilters, cardData.membersById)) setFilters(NO_FILTERS)
            closeDialog()
          }}
        />
      )}
      {editingTask && (
        <TaskDialog
          key={editingTask.id}
          task={editingTask}
          members={members}
          labels={labels}
          comments={cardData.commentsByTask.get(editingTask.id)}
          onAddComment={(body, onFailure) => commentStore.addComment(editingTask.id, body, onFailure)}
          onDeleteComment={commentStore.deleteComment}
          whenWritesSettled={whenSettled}
          onClose={closeDialog}
          onSave={(draft) => {
            taskStore.editTask(editingTask.id, draft)
            closeDialog()
          }}
          onDelete={() => {
            taskStore.deleteTask(editingTask.id)
            closeDialog()
          }}
        />
      )}
      {dialog.mode === 'team' && (
        <TeamDialog
          members={members}
          tasks={tasks}
          onAdd={teamStore.addMember}
          onUpdate={teamStore.updateMember}
          onRemove={teamStore.removeMember}
          onClose={closeDialog}
        />
      )}
      {dialog.mode === 'labels' && (
        <LabelsDialog
          labels={labels}
          tasks={tasks}
          onAdd={labelStore.addLabel}
          onUpdate={labelStore.updateLabel}
          onRemove={labelStore.removeLabel}
          onClose={closeDialog}
        />
      )}

      {toast && <Toast message={toast} onDismiss={dismissToast} />}
    </div>
  )
}

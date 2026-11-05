import { UserPlus } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { AvatarStack } from './components/Avatar'
import { Board } from './components/Board'
import { BoardSkeleton } from './components/BoardSkeleton'
import { ErrorState } from './components/ErrorState'
import { Header } from './components/Header'
import { TaskDialog } from './components/TaskDialog'
import { TeamDialog } from './components/TeamDialog'
import { Toast } from './components/Toast'
import { useGuestSession } from './hooks/useGuestSession'
import { useTasks } from './hooks/useTasks'
import { useTeamMembers } from './hooks/useTeamMembers'
import { useWriteQueue } from './hooks/useWriteQueue'
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

function Workspace({ userId }: { userId: string }) {
  const [toast, setToast] = useState<string | null>(null)
  const [dialog, setDialog] = useState<DialogState>({ mode: 'closed' })
  const enqueueWrite = useWriteQueue(setToast)
  const taskStore = useTasks(userId, enqueueWrite)
  const teamStore = useTeamMembers(userId, enqueueWrite)
  const { tasks } = taskStore
  const { members } = teamStore

  const membersById = useMemo(() => new Map(members.map((member) => [member.id, member])), [members])
  const dismissToast = useCallback(() => setToast(null), [])
  const closeDialog = () => setDialog({ mode: 'closed' })

  const failedLoad = [taskStore.loadState, teamStore.loadState].find((state) => state.status === 'error')
  const isReady = taskStore.loadState.status === 'ready' && teamStore.loadState.status === 'ready'

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
          }}
        />
      ) : !isReady ? (
        <BoardSkeleton />
      ) : (
        <>
          <div className="toolbar">
            <button type="button" className="team-button" onClick={() => setDialog({ mode: 'team' })}>
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
          </div>
          <Board
            tasks={tasks}
            membersById={membersById}
            onMoveTask={taskStore.moveTask}
            onOpenTask={(taskId) => setDialog({ mode: 'edit', taskId })}
            onAddTask={(status) => setDialog({ mode: 'create', status })}
          />
        </>
      )}

      {dialog.mode === 'create' && (
        <TaskDialog
          initialStatus={dialog.status}
          members={members}
          onClose={closeDialog}
          onSave={(draft) => {
            taskStore.createTask(draft)
            closeDialog()
          }}
        />
      )}
      {editingTask && (
        <TaskDialog
          key={editingTask.id}
          task={editingTask}
          members={members}
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

      {toast && <Toast message={toast} onDismiss={dismissToast} />}
    </div>
  )
}

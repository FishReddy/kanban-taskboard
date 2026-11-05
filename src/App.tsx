import { useCallback, useState } from 'react'
import { Board } from './components/Board'
import { BoardSkeleton } from './components/BoardSkeleton'
import { ErrorState } from './components/ErrorState'
import { Header } from './components/Header'
import { TaskDialog } from './components/TaskDialog'
import { Toast } from './components/Toast'
import { useGuestSession } from './hooks/useGuestSession'
import { useTasks } from './hooks/useTasks'
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

function Workspace({ userId }: { userId: string }) {
  const [toast, setToast] = useState<string | null>(null)
  const [dialog, setDialog] = useState<DialogState>({ mode: 'closed' })
  const { tasks, loadState, reload, createTask, editTask, moveTask, deleteTask } = useTasks(
    userId,
    setToast,
  )
  const dismissToast = useCallback(() => setToast(null), [])
  const closeDialog = () => setDialog({ mode: 'closed' })

  const editingTask =
    dialog.mode === 'edit' ? tasks.find((task) => task.id === dialog.taskId) : undefined

  return (
    <div className="app">
      <Header
        onNewTask={
          loadState.status === 'ready' ? () => setDialog({ mode: 'create', status: 'todo' }) : undefined
        }
      />

      {loadState.status === 'loading' && <BoardSkeleton />}
      {loadState.status === 'error' && (
        <ErrorState
          title="We couldn't load your board"
          message={loadState.message}
          onRetry={reload}
        />
      )}
      {loadState.status === 'ready' && (
        <Board
          tasks={tasks}
          onMoveTask={moveTask}
          onOpenTask={(taskId) => setDialog({ mode: 'edit', taskId })}
          onAddTask={(status) => setDialog({ mode: 'create', status })}
        />
      )}

      {dialog.mode === 'create' && (
        <TaskDialog
          initialStatus={dialog.status}
          onClose={closeDialog}
          onSave={(draft) => {
            createTask(draft)
            closeDialog()
          }}
        />
      )}
      {editingTask && (
        <TaskDialog
          key={editingTask.id}
          task={editingTask}
          onClose={closeDialog}
          onSave={(draft) => {
            editTask(editingTask.id, draft)
            closeDialog()
          }}
          onDelete={() => {
            deleteTask(editingTask.id)
            closeDialog()
          }}
        />
      )}

      {toast && <Toast message={toast} onDismiss={dismissToast} />}
    </div>
  )
}

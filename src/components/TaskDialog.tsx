import { Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useModalDialog } from '../hooks/useModalDialog'
import { COLUMNS, PRIORITY_LABELS } from '../lib/board'
import {
  PRIORITIES,
  STATUSES,
  type Label,
  type Task,
  type TaskComment,
  type TaskDraft,
  type TaskPriority,
  type TaskStatus,
  type TeamMember,
} from '../lib/types'
import { ActivityPanel } from './ActivityPanel'
import { Avatar } from './Avatar'
import { CommentsPanel } from './CommentsPanel'
import { LabelPill } from './LabelPill'

const TITLE_MAX = 200
const NEW_TASK_DEFAULTS: Pick<TaskDraft, 'priority' | 'assignee_ids' | 'label_ids'> = {
  priority: 'none',
  assignee_ids: [],
  label_ids: [],
}

interface TaskDialogProps {
  /** Present when editing; absent when creating. */
  task?: Task
  initialStatus?: TaskStatus
  /** What a new task starts with, so it stays visible under active filters. */
  initialValues?: Pick<TaskDraft, 'priority' | 'assignee_ids' | 'label_ids'>
  members: TeamMember[]
  labels: Label[]
  comments?: TaskComment[]
  onAddComment?: (body: string, onFailure?: () => void) => void
  onDeleteComment?: (id: string, onFailure?: () => void) => void
  whenWritesSettled?: () => Promise<void>
  onSave: (draft: TaskDraft) => void
  onDelete?: () => void
  onClose: () => void
}

export function TaskDialog({
  task,
  initialStatus = 'todo',
  initialValues = NEW_TASK_DEFAULTS,
  members,
  labels,
  comments = [],
  onAddComment,
  onDeleteComment,
  whenWritesSettled,
  onSave,
  onDelete,
  onClose,
}: TaskDialogProps) {
  const dialogRef = useModalDialog()
  const titleRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? initialStatus)
  const starting = task ?? initialValues
  const [priority, setPriority] = useState<TaskPriority>(starting.priority)
  const [dueDate, setDueDate] = useState(task?.due_date ?? '')
  const [assigneeIds, setAssigneeIds] = useState<string[]>(starting.assignee_ids)
  const [labelIds, setLabelIds] = useState<string[]>(starting.label_ids)
  const [titleError, setTitleError] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [commentDraft, setCommentDraft] = useState('')
  const [sidePanel, setSidePanel] = useState<'comments' | 'activity'>('comments')
  const showComments =
    task !== undefined &&
    onAddComment !== undefined &&
    onDeleteComment !== undefined &&
    whenWritesSettled !== undefined

  // showModal focuses the first focusable element (the close button), and it
  // ignores React's autoFocus, so the title has to be focused explicitly.
  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  const isDirty =
    title !== (task?.title ?? '') ||
    description !== (task?.description ?? '') ||
    status !== (task?.status ?? initialStatus) ||
    priority !== starting.priority ||
    dueDate !== (task?.due_date ?? '') ||
    assigneeIds.join() !== starting.assignee_ids.join() ||
    labelIds.join() !== starting.label_ids.join() ||
    commentDraft.trim() !== ''

  function toggleAssignee(memberId: string) {
    setAssigneeIds((current) =>
      current.includes(memberId) ? current.filter((id) => id !== memberId) : [...current, memberId],
    )
  }

  function toggleLabel(labelId: string) {
    setLabelIds((current) =>
      current.includes(labelId) ? current.filter((id) => id !== labelId) : [...current, labelId],
    )
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setTitleError('Give the task a title.')
      return
    }
    // Saving closes the dialog, so post a typed comment rather than discard it.
    if (commentDraft.trim()) onAddComment?.(commentDraft.trim())
    onSave({
      title: trimmedTitle,
      description: description.trim() || null,
      status,
      priority,
      due_date: dueDate || null,
      assignee_ids: assigneeIds,
      label_ids: labelIds,
    })
  }

  return (
    <dialog
      ref={dialogRef}
      className={`dialog${showComments ? ' dialog--detail' : ''}`}
      aria-labelledby="task-dialog-title"
      onClose={onClose}
      onMouseDown={(event) => {
        // A stray click on the backdrop shouldn't throw away typed work.
        if (event.target === dialogRef.current && !isDirty) onClose()
      }}
    >
      <header className="dialog__header">
        <h2 id="task-dialog-title">{task ? 'Task details' : 'New task'}</h2>
        <button type="button" className="icon-button icon-button--small" onClick={onClose} aria-label="Close">
          <X size={16} aria-hidden />
        </button>
      </header>

      <div className="dialog__panes">
        <form className="dialog__form" onSubmit={handleSubmit} noValidate>
          <div className="dialog__body">
            <div className="field">
              <label htmlFor="task-title">Title</label>
              <input
                id="task-title"
                ref={titleRef}
                value={title}
                maxLength={TITLE_MAX}
                placeholder="What needs doing?"
                aria-invalid={titleError !== null}
                aria-describedby={titleError ? 'task-title-error' : undefined}
                onChange={(event) => {
                  setTitle(event.target.value)
                  setTitleError(null)
                }}
              />
              {titleError && (
                <p id="task-title-error" className="field__error">
                  {titleError}
                </p>
              )}
            </div>

            <div className="field">
              <label htmlFor="task-description">
                Description <span className="field__optional">Optional</span>
              </label>
              <textarea
                id="task-description"
                rows={4}
                maxLength={5000}
                value={description}
                placeholder="Add any context, links or notes"
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="task-status">Status</label>
                <select
                  id="task-status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as TaskStatus)}
                >
                  {STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {COLUMNS[value].title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="task-due">
                  Due date <span className="field__optional">Optional</span>
                </label>
                <input
                  id="task-due"
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                />
              </div>
            </div>

            <fieldset className="field">
              <legend>Priority</legend>
              <div className="segmented">
                {PRIORITIES.map((value) => (
                  <label key={value} className="segmented__option">
                    <input
                      type="radio"
                      name="task-priority"
                      value={value}
                      checked={priority === value}
                      onChange={() => setPriority(value)}
                    />
                    <span>{PRIORITY_LABELS[value]}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="field">
              <legend>
                Assignees <span className="field__optional">Optional</span>
              </legend>
              {members.length === 0 ? (
                <p className="field__hint">
                  No team yet. Add people with the Team button above the board.
                </p>
              ) : (
                <div className="chip-picker">
                  {members.map((member) => (
                    <label key={member.id} className="chip-option">
                      <input
                        type="checkbox"
                        checked={assigneeIds.includes(member.id)}
                        onChange={() => toggleAssignee(member.id)}
                      />
                      <span className="chip-option__chip">
                        <Avatar member={member} size="small" />
                        {member.name}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </fieldset>

            <fieldset className="field">
              <legend>
                Labels <span className="field__optional">Optional</span>
              </legend>
              {labels.length === 0 ? (
                <p className="field__hint">
                  No labels yet. Create them with the Labels button above the board.
                </p>
              ) : (
                <div className="chip-picker">
                  {labels.map((label) => (
                    <label key={label.id} className="chip-option">
                      <input
                        type="checkbox"
                        checked={labelIds.includes(label.id)}
                        onChange={() => toggleLabel(label.id)}
                      />
                      <span className="chip-option__chip chip-option__chip--label">
                        <LabelPill label={label} />
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </fieldset>
          </div>

          <footer className="dialog__footer">
            {onDelete && (
              <button
                type="button"
                className="button button--danger"
                onClick={() => (confirmingDelete ? onDelete() : setConfirmingDelete(true))}
                onBlur={() => setConfirmingDelete(false)}
              >
                <Trash2 size={14} aria-hidden />
                {confirmingDelete ? 'Confirm delete' : 'Delete'}
              </button>
            )}
            <div className="dialog__footer-end">
              <button type="button" className="button button--ghost" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="button button--primary">
                {task ? 'Save changes' : 'Create task'}
              </button>
            </div>
          </footer>
        </form>

        {showComments && (
          <section className="side-panel" aria-label="Comments and activity">
            <div className="segmented side-panel__tabs" role="radiogroup" aria-label="Show">
              <label className="segmented__option">
                <input
                  type="radio"
                  name="task-side-panel"
                  checked={sidePanel === 'comments'}
                  onChange={() => setSidePanel('comments')}
                />
                <span>{comments.length > 0 ? `Comments (${comments.length})` : 'Comments'}</span>
              </label>
              <label className="segmented__option">
                <input
                  type="radio"
                  name="task-side-panel"
                  checked={sidePanel === 'activity'}
                  onChange={() => setSidePanel('activity')}
                />
                <span>Activity</span>
              </label>
            </div>

            {sidePanel === 'comments' ? (
              <CommentsPanel
                comments={comments}
                draft={commentDraft}
                onDraftChange={setCommentDraft}
                onAdd={onAddComment}
                onDelete={onDeleteComment}
              />
            ) : (
              <ActivityPanel taskId={task.id} whenSettled={whenWritesSettled} />
            )}
          </section>
        )}
      </div>
    </dialog>
  )
}

import { Pencil, Tag, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { useModalDialog } from '../hooks/useModalDialog'
import { isLabelNameTaken, LABEL_NAME_MAX } from '../lib/labels'
import { nextColor } from '../lib/team'
import type { Label, LabelDraft, Task } from '../lib/types'
import { LabelPill } from './LabelPill'
import { NameColorForm } from './NameColorForm'

const NAME_PLACEHOLDER = 'Bug, Design, Urgent…'

function describeUsage(count: number): string {
  if (count === 0) return 'Not on any tasks'
  return count === 1 ? 'On 1 task' : `On ${count} tasks`
}

interface LabelsDialogProps {
  labels: Label[]
  tasks: Task[]
  onAdd: (draft: LabelDraft) => void
  onUpdate: (id: string, draft: LabelDraft) => void
  onRemove: (id: string) => void
  onClose: () => void
}

export function LabelsDialog({ labels, tasks, onAdd, onUpdate, onRemove, onClose }: LabelsDialogProps) {
  const dialogRef = useModalDialog()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmingRemoveId, setConfirmingRemoveId] = useState<string | null>(null)
  // Remounting the add form clears it and returns focus, ready for the next name.
  const [addFormKey, setAddFormKey] = useState(0)

  const validateName = (exceptId?: string) => (name: string) =>
    isLabelNameTaken(name, labels, exceptId) ? 'You already have a label with that name.' : null

  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      aria-labelledby="labels-dialog-title"
      onClose={onClose}
      onMouseDown={(event) => {
        if (event.target === dialogRef.current) onClose()
      }}
    >
      <div className="dialog__form">
        <header className="dialog__header">
          <h2 id="labels-dialog-title">Labels</h2>
          <button type="button" className="icon-button icon-button--small" onClick={onClose} aria-label="Close">
            <X size={16} aria-hidden />
          </button>
        </header>

        <div className="dialog__body">
          {labels.length === 0 ? (
            <div className="team-empty">
              <Tag size={20} aria-hidden />
              <p>Create labels to group related tasks, then filter the board by them.</p>
            </div>
          ) : (
            <ul className="member-list">
              {labels.map((label) => (
                <li key={label.id} className="member-row">
                  {editingId === label.id ? (
                    <NameColorForm
                      idPrefix={`edit-${label.id}`}
                      initial={label}
                      nameMax={LABEL_NAME_MAX}
                      placeholder={NAME_PLACEHOLDER}
                      submitLabel="Save"
                      validateName={validateName(label.id)}
                      onCancel={() => setEditingId(null)}
                      onSubmit={(draft) => {
                        onUpdate(label.id, draft)
                        setEditingId(null)
                      }}
                    />
                  ) : (
                    <>
                      <div className="member-row__text">
                        <span>
                          <LabelPill label={label} />
                        </span>
                        <span className="member-row__meta">
                          {describeUsage(tasks.filter((task) => task.label_ids.includes(label.id)).length)}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="icon-button icon-button--small"
                        onClick={() => setEditingId(label.id)}
                        aria-label={`Edit ${label.name}`}
                      >
                        <Pencil size={14} aria-hidden />
                      </button>
                      {confirmingRemoveId === label.id ? (
                        <button
                          type="button"
                          className="button button--danger button--compact"
                          autoFocus
                          onClick={() => {
                            onRemove(label.id)
                            setConfirmingRemoveId(null)
                            // The focused button is about to disappear, so send
                            // focus to the add form rather than losing it.
                            setAddFormKey((key) => key + 1)
                          }}
                          onBlur={() => setConfirmingRemoveId(null)}
                        >
                          Delete
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="icon-button icon-button--small"
                          onClick={() => setConfirmingRemoveId(label.id)}
                          aria-label={`Delete ${label.name}`}
                        >
                          <Trash2 size={14} aria-hidden />
                        </button>
                      )}
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {editingId === null && (
          <footer className="dialog__section">
            <NameColorForm
              key={addFormKey}
              idPrefix="add-label"
              initial={{ name: '', color: nextColor(labels) }}
              nameMax={LABEL_NAME_MAX}
              placeholder={NAME_PLACEHOLDER}
              submitLabel="Add label"
              validateName={validateName()}
              onSubmit={(draft) => {
                onAdd(draft)
                setAddFormKey((key) => key + 1)
              }}
            />
          </footer>
        )}
      </div>
    </dialog>
  )
}

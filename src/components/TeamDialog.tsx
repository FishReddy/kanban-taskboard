import { Pencil, Trash2, Users, X } from 'lucide-react'
import { useState } from 'react'
import { useModalDialog } from '../hooks/useModalDialog'
import { nextColor } from '../lib/team'
import type { Task, TeamMember, TeamMemberDraft } from '../lib/types'
import { Avatar } from './Avatar'
import { NameColorForm } from './NameColorForm'

const NAME_MAX = 50
const NAME_PLACEHOLDER = "Who's on the team?"

function describeWorkload(count: number): string {
  if (count === 0) return 'No tasks assigned'
  return count === 1 ? '1 task assigned' : `${count} tasks assigned`
}

interface TeamDialogProps {
  members: TeamMember[]
  tasks: Task[]
  onAdd: (draft: TeamMemberDraft) => void
  onUpdate: (id: string, draft: TeamMemberDraft) => void
  onRemove: (id: string) => void
  onClose: () => void
}

export function TeamDialog({ members, tasks, onAdd, onUpdate, onRemove, onClose }: TeamDialogProps) {
  const dialogRef = useModalDialog()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmingRemoveId, setConfirmingRemoveId] = useState<string | null>(null)
  // Remounting the add form clears it and returns focus, ready for the next name.
  const [addFormKey, setAddFormKey] = useState(0)

  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      aria-labelledby="team-dialog-title"
      onClose={onClose}
      onMouseDown={(event) => {
        if (event.target === dialogRef.current) onClose()
      }}
    >
      <div className="dialog__form">
        <header className="dialog__header">
          <h2 id="team-dialog-title">Team</h2>
          <button type="button" className="icon-button icon-button--small" onClick={onClose} aria-label="Close">
            <X size={16} aria-hidden />
          </button>
        </header>

        <div className="dialog__body">
          {members.length === 0 ? (
            <div className="team-empty">
              <Users size={20} aria-hidden />
              <p>Add the people you work with, then assign them to tasks.</p>
            </div>
          ) : (
            <ul className="member-list">
              {members.map((member) => (
                <li key={member.id} className="member-row">
                  {editingId === member.id ? (
                    <NameColorForm
                      idPrefix={`edit-${member.id}`}
                      initial={member}
                      nameMax={NAME_MAX}
                      placeholder={NAME_PLACEHOLDER}
                      submitLabel="Save"
                      onCancel={() => setEditingId(null)}
                      onSubmit={(draft) => {
                        onUpdate(member.id, draft)
                        setEditingId(null)
                      }}
                    />
                  ) : (
                    <>
                      <Avatar member={member} />
                      <div className="member-row__text">
                        <span className="member-row__name">{member.name}</span>
                        <span className="member-row__meta">
                          {describeWorkload(
                            tasks.filter((task) => task.assignee_ids.includes(member.id)).length,
                          )}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="icon-button icon-button--small"
                        onClick={() => setEditingId(member.id)}
                        aria-label={`Edit ${member.name}`}
                      >
                        <Pencil size={14} aria-hidden />
                      </button>
                      {confirmingRemoveId === member.id ? (
                        <button
                          type="button"
                          className="button button--danger button--compact"
                          autoFocus
                          onClick={() => {
                            onRemove(member.id)
                            setConfirmingRemoveId(null)
                            // The focused button is about to disappear, so send
                            // focus to the add form rather than losing it.
                            setAddFormKey((key) => key + 1)
                          }}
                          onBlur={() => setConfirmingRemoveId(null)}
                        >
                          Remove
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="icon-button icon-button--small"
                          onClick={() => setConfirmingRemoveId(member.id)}
                          aria-label={`Remove ${member.name}`}
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
              idPrefix="add-member"
              initial={{ name: '', color: nextColor(members) }}
              nameMax={NAME_MAX}
              placeholder={NAME_PLACEHOLDER}
              submitLabel="Add member"
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

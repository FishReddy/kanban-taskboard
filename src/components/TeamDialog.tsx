import { Check, Pencil, Trash2, Users, X } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useModalDialog } from '../hooks/useModalDialog'
import { MEMBER_COLORS, nextMemberColor } from '../lib/team'
import type { Task, TeamMember, TeamMemberDraft } from '../lib/types'
import { Avatar } from './Avatar'

const NAME_MAX = 50

interface MemberFormProps {
  idPrefix: string
  initial: TeamMemberDraft
  submitLabel: string
  onSubmit: (draft: TeamMemberDraft) => void
  onCancel?: () => void
}

function MemberForm({ idPrefix, initial, submitLabel, onSubmit, onCancel }: MemberFormProps) {
  const nameRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(initial.name)
  const [color, setColor] = useState(initial.color)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Enter a name.')
      return
    }
    onSubmit({ name: trimmed, color })
  }

  return (
    <form className="member-form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor={`${idPrefix}-name`}>Name</label>
        <input
          id={`${idPrefix}-name`}
          ref={nameRef}
          value={name}
          maxLength={NAME_MAX}
          placeholder="Who's on the team?"
          aria-invalid={error !== null}
          aria-describedby={error ? `${idPrefix}-error` : undefined}
          onChange={(event) => {
            setName(event.target.value)
            setError(null)
          }}
        />
        {error && (
          <p id={`${idPrefix}-error`} className="field__error">
            {error}
          </p>
        )}
      </div>

      <fieldset className="field">
        <legend>Colour</legend>
        <div className="swatches">
          {MEMBER_COLORS.map((swatch, index) => (
            <label key={swatch} className="swatch">
              <input
                type="radio"
                name={`${idPrefix}-color`}
                value={swatch}
                checked={color === swatch}
                aria-label={`Colour ${index + 1}`}
                onChange={() => setColor(swatch)}
              />
              <span style={{ backgroundColor: swatch }}>
                <Check size={13} aria-hidden />
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="member-form__actions">
        {onCancel && (
          <button type="button" className="button button--ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="button button--primary">
          {submitLabel}
        </button>
      </div>
    </form>
  )
}

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
                    <MemberForm
                      idPrefix={`edit-${member.id}`}
                      initial={member}
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
            <MemberForm
              key={addFormKey}
              idPrefix="add-member"
              initial={{ name: '', color: nextMemberColor(members) }}
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

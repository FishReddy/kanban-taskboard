import { Check } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { SWATCH_COLORS } from '../lib/team'

interface NameColorDraft {
  name: string
  color: string
}

interface NameColorFormProps {
  idPrefix: string
  initial: NameColorDraft
  nameMax: number
  placeholder: string
  submitLabel: string
  /** Returns a message when the trimmed name can't be used. */
  validateName?: (name: string) => string | null
  onSubmit: (draft: NameColorDraft) => void
  onCancel?: () => void
}

/** The form shared by team members and labels: a name and a colour. */
export function NameColorForm({
  idPrefix,
  initial,
  nameMax,
  placeholder,
  submitLabel,
  validateName,
  onSubmit,
  onCancel,
}: NameColorFormProps) {
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
    const problem = trimmed ? (validateName?.(trimmed) ?? null) : 'Enter a name.'
    if (problem) {
      setError(problem)
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
          maxLength={nameMax}
          placeholder={placeholder}
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
          {SWATCH_COLORS.map((swatch, index) => (
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

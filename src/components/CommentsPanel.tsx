import { MessageSquare, Trash2 } from 'lucide-react'
import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from 'react'
import { COMMENT_MAX, formatRelativeTime } from '../lib/comments'
import type { TaskComment } from '../lib/types'

interface CommentsPanelProps {
  comments: TaskComment[]
  /** Owned by the task dialog, so a stray backdrop click can't lose typed text. */
  draft: string
  onDraftChange: Dispatch<SetStateAction<string>>
  onAdd: (body: string, onFailure: () => void) => void
  onDelete: (id: string, onFailure: () => void) => void
}

export function CommentsPanel({ comments, draft, onDraftChange, onAdd, onDelete }: CommentsPanelProps) {
  const listRef = useRef<HTMLOListElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)

  // Keep the newest comment in view on opening and after posting, but leave the
  // scroll position alone when one is deleted.
  const shownCount = useRef(0)
  useEffect(() => {
    if (comments.length > shownCount.current && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
    shownCount.current = comments.length
  }, [comments.length])

  function post() {
    const body = draft.trim()
    if (!body) return
    setError(null)
    onDraftChange('')
    onAdd(body, () => {
      // Hand the text back rather than making them type it again.
      onDraftChange((current) => (current.trim() ? current : body))
      setError("Your comment didn't post. It's back in the box so you can try again.")
    })
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    post()
  }

  function confirmDelete(id: string) {
    setError(null)
    setConfirmingDeleteId(null)
    onDelete(id, () => setError("That comment couldn't be deleted, so it's been restored."))
    // The focused button is about to disappear, so give focus somewhere useful.
    inputRef.current?.focus()
  }

  return (
    <section className="comments" aria-labelledby="comments-title">
      <header className="comments__header">
        <h3 id="comments-title">Comments</h3>
        {comments.length > 0 && <span className="comments__count">{comments.length}</span>}
      </header>

      {comments.length === 0 ? (
        <div className="comments__empty">
          <MessageSquare size={20} aria-hidden />
          <p>No comments yet. Use them for updates, questions and decisions.</p>
        </div>
      ) : (
        <ol ref={listRef} className="comment-list">
          {comments.map((comment) => (
            <li key={comment.id} className="comment">
              <div className="comment__meta">
                <span className="comment__author">You</span>
                <time
                  className="comment__time"
                  dateTime={comment.created_at}
                  title={new Date(comment.created_at).toLocaleString()}
                >
                  {formatRelativeTime(comment.created_at)}
                </time>
                {confirmingDeleteId === comment.id ? (
                  <button
                    type="button"
                    className="button button--danger button--compact comment__delete-confirm"
                    autoFocus
                    onClick={() => confirmDelete(comment.id)}
                    onBlur={() => setConfirmingDeleteId(null)}
                  >
                    Delete
                  </button>
                ) : (
                  <button
                    type="button"
                    className="icon-button icon-button--small comment__delete"
                    onClick={() => setConfirmingDeleteId(comment.id)}
                    aria-label={`Delete comment: ${comment.body.slice(0, 40)}`}
                  >
                    <Trash2 size={13} aria-hidden />
                  </button>
                )}
              </div>
              <p className="comment__body">{comment.body}</p>
            </li>
          ))}
        </ol>
      )}

      <form className="comment-form" onSubmit={handleSubmit}>
        {error && (
          <p className="field__error" role="alert">
            {error}
          </p>
        )}
        <div className="field">
          <textarea
            ref={inputRef}
            rows={2}
            maxLength={COMMENT_MAX}
            value={draft}
            placeholder="Write a comment"
            aria-label="Write a comment"
            onChange={(event) => onDraftChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                event.preventDefault()
                post()
              }
            }}
          />
        </div>
        <div className="comment-form__actions">
          <button
            type="submit"
            className="button button--primary"
            disabled={!draft.trim()}
            title="Post comment (Ctrl+Enter)"
          >
            Comment
          </button>
        </div>
      </form>
    </section>
  )
}

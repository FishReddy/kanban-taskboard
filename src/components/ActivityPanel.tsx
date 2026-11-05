import { useTaskActivity } from '../hooks/useTaskActivity'
import { describeActivity } from '../lib/activity'
import { formatRelativeTime } from '../lib/time'

interface ActivityPanelProps {
  taskId: string
  whenSettled: () => Promise<void>
}

export function ActivityPanel({ taskId, whenSettled }: ActivityPanelProps) {
  const { entries, loadState, reload } = useTaskActivity(taskId, whenSettled)

  if (loadState.status === 'loading') {
    return (
      <div className="activity-loading" role="status" aria-label="Loading activity">
        <span className="skeleton-line" />
        <span className="skeleton-line skeleton-line--short" />
        <span className="skeleton-line" />
        <span className="skeleton-line skeleton-line--short" />
      </div>
    )
  }

  if (loadState.status === 'error') {
    return (
      <div className="panel-message" role="alert">
        <p>{loadState.message}</p>
        <button type="button" className="button button--ghost" onClick={reload}>
          Try again
        </button>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="panel-message">
        <p>No activity yet. Moves, edits and assignments will appear here.</p>
      </div>
    )
  }

  return (
    <ol className="activity-list">
      {entries.map((entry) => (
        <li key={entry.id} className="activity-item">
          <span className="activity-item__text">{describeActivity(entry)}</span>
          <time
            className="activity-item__time"
            dateTime={entry.created_at}
            title={new Date(entry.created_at).toLocaleString()}
          >
            {formatRelativeTime(entry.created_at)}
          </time>
        </li>
      ))}
    </ol>
  )
}

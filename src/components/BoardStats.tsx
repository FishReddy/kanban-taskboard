import type { BoardStatValues } from '../lib/stats'

/** Each term comes first for screen readers. CSS shows the number first. */
export function BoardStats({ stats }: { stats: BoardStatValues }) {
  return (
    <dl className="board-stats" aria-label="Board summary">
      <div className="board-stats__item">
        <dt>{stats.total === 1 ? 'Task' : 'Tasks'}</dt>
        <dd>{stats.total}</dd>
      </div>
      <div className="board-stats__item">
        <dt>Completed</dt>
        <dd>{stats.completed}</dd>
      </div>
      <div className={`board-stats__item${stats.overdue > 0 ? ' board-stats__item--alert' : ''}`}>
        <dt>Overdue</dt>
        <dd>{stats.overdue}</dd>
      </div>
    </dl>
  )
}

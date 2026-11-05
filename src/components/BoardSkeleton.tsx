import { COLUMNS } from '../lib/board'
import { STATUSES } from '../lib/types'

const PLACEHOLDER_CARDS = [3, 2, 1, 2]

export function BoardSkeleton() {
  return (
    <>
      {/* Keeps the board from jumping when the real toolbar appears. */}
      <div className="toolbar" aria-hidden />
      <main className="board" aria-busy="true" aria-label="Loading your board">
        {STATUSES.map((status, index) => (
          <section className="column" data-status={status} key={status} aria-hidden>
            <header className="column__header">
              <span className="column__dot" />
              <h2 className="column__title">{COLUMNS[status].title}</h2>
            </header>
            <div className="column__body">
              {Array.from({ length: PLACEHOLDER_CARDS[index] }, (_, card) => (
                <div className="skeleton-card" key={card}>
                  <span className="skeleton-line" />
                  <span className="skeleton-line skeleton-line--short" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>
    </>
  )
}

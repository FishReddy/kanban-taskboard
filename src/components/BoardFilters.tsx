import { Search, X } from 'lucide-react'
import { useRef } from 'react'
import { PRIORITY_LABELS } from '../lib/board'
import { hasActiveFilters, NO_FILTERS, UNASSIGNED, type BoardFilterValues } from '../lib/filters'
import { PRIORITIES, type Label, type TaskPriority, type TeamMember } from '../lib/types'
import { labelColorStyle } from './LabelPill'

interface BoardFiltersProps {
  filters: BoardFilterValues
  members: TeamMember[]
  labels: Label[]
  visibleCount: number
  totalCount: number
  onChange: (filters: BoardFilterValues) => void
}

export function BoardFilters({
  filters,
  members,
  labels,
  visibleCount,
  totalCount,
  onChange,
}: BoardFiltersProps) {
  const searchRef = useRef<HTMLInputElement>(null)

  function toggleLabel(id: string) {
    const { labelIds } = filters
    onChange({
      ...filters,
      labelIds: labelIds.includes(id) ? labelIds.filter((other) => other !== id) : [...labelIds, id],
    })
  }

  function clearSearch() {
    onChange({ ...filters, query: '' })
    searchRef.current?.focus()
  }

  return (
    <div className="filters" role="search" aria-label="Search and filter tasks">
      <div className="search">
        <Search size={14} className="search__icon" aria-hidden />
        <input
          ref={searchRef}
          type="text"
          className="search__input"
          value={filters.query}
          placeholder="Search tasks"
          aria-label="Search tasks by title"
          onChange={(event) => onChange({ ...filters, query: event.target.value })}
          onKeyDown={(event) => {
            if (event.key === 'Escape') clearSearch()
          }}
        />
        {filters.query && (
          <button
            type="button"
            className="icon-button icon-button--small search__clear"
            onClick={clearSearch}
            aria-label="Clear search"
          >
            <X size={13} aria-hidden />
          </button>
        )}
      </div>

      <select
        className="filter-select"
        aria-label="Filter by priority"
        data-active={filters.priority !== null}
        value={filters.priority ?? ''}
        onChange={(event) =>
          onChange({ ...filters, priority: (event.target.value || null) as TaskPriority | null })
        }
      >
        <option value="">Any priority</option>
        {PRIORITIES.map((priority) => (
          <option key={priority} value={priority}>
            {priority === 'none' ? 'No priority' : `${PRIORITY_LABELS[priority]} priority`}
          </option>
        ))}
      </select>

      {members.length > 0 && (
        <select
          className="filter-select"
          aria-label="Filter by assignee"
          data-active={filters.assignee !== null}
          value={filters.assignee ?? ''}
          onChange={(event) => onChange({ ...filters, assignee: event.target.value || null })}
        >
          <option value="">Anyone</option>
          <option value={UNASSIGNED}>Unassigned</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      )}

      {labels.length > 0 && (
        <div className="label-filter" role="group" aria-label="Filter by label">
          {labels.map((label) => (
            <button
              key={label.id}
              type="button"
              className="label-filter__chip"
              style={labelColorStyle(label)}
              aria-pressed={filters.labelIds.includes(label.id)}
              onClick={() => toggleLabel(label.id)}
            >
              <i className="label-pill__dot" aria-hidden />
              <span className="label-pill__name">{label.name}</span>
            </button>
          ))}
        </div>
      )}

      {hasActiveFilters(filters) && (
        <>
          <span className="filters__count" role="status">
            {visibleCount} of {totalCount} tasks
          </span>
          <button
            type="button"
            className="button button--compact filters__clear"
            onClick={() => onChange(NO_FILTERS)}
          >
            <X size={12} aria-hidden />
            Clear
          </button>
        </>
      )}
    </div>
  )
}

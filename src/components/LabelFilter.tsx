import { X } from 'lucide-react'
import type { Label } from '../lib/types'
import { labelColorStyle } from './LabelPill'

interface LabelFilterProps {
  labels: Label[]
  activeIds: string[]
  visibleCount: number
  totalCount: number
  onToggle: (id: string) => void
  onClear: () => void
}

export function LabelFilter({
  labels,
  activeIds,
  visibleCount,
  totalCount,
  onToggle,
  onClear,
}: LabelFilterProps) {
  return (
    <div className="label-filter" role="group" aria-label="Filter by label">
      {labels.map((label) => (
        <button
          key={label.id}
          type="button"
          className="label-filter__chip"
          style={labelColorStyle(label)}
          aria-pressed={activeIds.includes(label.id)}
          onClick={() => onToggle(label.id)}
        >
          <i className="label-pill__dot" aria-hidden />
          <span className="label-pill__name">{label.name}</span>
        </button>
      ))}
      {activeIds.length > 0 && (
        <>
          <span className="label-filter__count" role="status">
            {visibleCount} of {totalCount} tasks
          </span>
          <button type="button" className="button button--compact label-filter__clear" onClick={onClear}>
            <X size={12} aria-hidden />
            Clear
          </button>
        </>
      )}
    </div>
  )
}

import type { CSSProperties } from 'react'
import type { Label } from '../lib/types'

export function labelColorStyle(label: Label): CSSProperties {
  return { '--label-color': label.color } as CSSProperties
}

export function LabelPill({ label }: { label: Label }) {
  return (
    <span className="label-pill" style={labelColorStyle(label)}>
      <i className="label-pill__dot" aria-hidden />
      <span className="label-pill__name">{label.name}</span>
    </span>
  )
}

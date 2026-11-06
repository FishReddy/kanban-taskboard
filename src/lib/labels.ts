import type { Label } from './types'

export const LABEL_NAME_MAX = 30

/** Looks up a task's labels, skipping ids of labels that have been deleted. */
export function resolveLabels(ids: string[], labelsById: ReadonlyMap<string, Label>): Label[] {
  return ids.flatMap((id) => {
    const label = labelsById.get(id)
    return label ? [label] : []
  })
}

/** Matches the database's rule: names are unique, ignoring case and outer spaces. */
export function isLabelNameTaken(name: string, labels: Label[], exceptId?: string): boolean {
  const normalized = name.trim().toLowerCase()
  return labels.some(
    (label) => label.id !== exceptId && label.name.trim().toLowerCase() === normalized,
  )
}

import type { Label, Task } from './types'

export const LABEL_NAME_MAX = 30

/** Looks up a task's labels, skipping ids of labels that have been deleted. */
export function resolveLabels(ids: string[], labelsById: ReadonlyMap<string, Label>): Label[] {
  return ids.flatMap((id) => {
    const label = labelsById.get(id)
    return label ? [label] : []
  })
}

/** Tasks with at least one of the labels. No labels means no filter. */
export function filterTasksByLabels(tasks: Task[], labelIds: string[]): Task[] {
  if (labelIds.length === 0) return tasks
  return tasks.filter((task) => task.label_ids.some((id) => labelIds.includes(id)))
}

/** Matches the database's rule: names are unique, ignoring case and outer spaces. */
export function isLabelNameTaken(name: string, labels: Label[], exceptId?: string): boolean {
  const normalized = name.trim().toLowerCase()
  return labels.some(
    (label) => label.id !== exceptId && label.name.trim().toLowerCase() === normalized,
  )
}

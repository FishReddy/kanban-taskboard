import type { TeamMember } from './types'

/** Colours for avatars and labels, all dark enough for white initials in both themes. */
export const SWATCH_COLORS = [
  '#5b5bd6',
  '#c2298a',
  '#d13438',
  '#b85c00',
  '#1a7f56',
  '#0f7f86',
  '#0d74ce',
  '#8145b5',
] as const

/** Up to two initials, from the first and last words of a name. */
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return ''
  const first = Array.from(words[0])[0]
  const last = words.length > 1 ? Array.from(words[words.length - 1])[0] : ''
  return (first + last).toUpperCase()
}

/** The first colour not used yet, cycling once all are in use. */
export function nextColor(items: { color: string }[]): string {
  const used = new Set(items.map((item) => item.color))
  return (
    SWATCH_COLORS.find((color) => !used.has(color)) ??
    SWATCH_COLORS[items.length % SWATCH_COLORS.length]
  )
}

/** Looks up a task's assignees, skipping ids of members no longer on the team. */
export function resolveMembers(
  ids: string[],
  membersById: ReadonlyMap<string, TeamMember>,
): TeamMember[] {
  return ids.flatMap((id) => {
    const member = membersById.get(id)
    return member ? [member] : []
  })
}

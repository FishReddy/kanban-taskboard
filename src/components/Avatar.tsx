import { getInitials } from '../lib/team'
import type { TeamMember } from '../lib/types'

type AvatarSize = 'small' | 'medium'

export function Avatar({ member, size = 'medium' }: { member: TeamMember; size?: AvatarSize }) {
  return (
    <span
      className={`avatar avatar--${size}`}
      style={{ backgroundColor: member.color }}
      title={member.name}
      aria-hidden
    >
      {getInitials(member.name)}
    </span>
  )
}

interface AvatarStackProps {
  members: TeamMember[]
  /** Avatars shown before the rest collapse into a "+n" count. */
  max?: number
  size?: AvatarSize
}

export function AvatarStack({ members, max = 3, size = 'medium' }: AvatarStackProps) {
  // Showing "+1" would take the same space as the avatar it hides.
  const visibleCount = members.length > max ? max - 1 : members.length
  const hidden = members.slice(visibleCount)

  return (
    <span className="avatar-stack">
      {members.slice(0, visibleCount).map((member) => (
        <Avatar key={member.id} member={member} size={size} />
      ))}
      {hidden.length > 0 && (
        <span
          className={`avatar avatar--${size} avatar--overflow`}
          title={hidden.map((member) => member.name).join(', ')}
          aria-hidden
        >
          +{hidden.length}
        </span>
      )}
    </span>
  )
}

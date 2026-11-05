import { describe, expect, it } from 'vitest'
import { getInitials, MEMBER_COLORS, nextMemberColor, resolveMembers } from './team'
import type { TeamMember } from './types'

function member(overrides: Partial<TeamMember>): TeamMember {
  return {
    id: 'id',
    name: 'Name',
    color: MEMBER_COLORS[0],
    user_id: 'user',
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('getInitials', () => {
  it('uses the first and last words', () => {
    expect(getInitials('Ada Lovelace')).toBe('AL')
    expect(getInitials('Mary Ann Evans')).toBe('ME')
  })

  it('handles single words, extra spaces and empty names', () => {
    expect(getInitials('ada')).toBe('A')
    expect(getInitials('  grace   hopper ')).toBe('GH')
    expect(getInitials('   ')).toBe('')
  })

  it('does not split characters outside the basic plane', () => {
    expect(getInitials('😀 smile')).toBe('😀S')
  })
})

describe('nextMemberColor', () => {
  it('picks the first unused colour', () => {
    expect(nextMemberColor([])).toBe(MEMBER_COLORS[0])
    expect(nextMemberColor([member({ color: MEMBER_COLORS[0] })])).toBe(MEMBER_COLORS[1])
  })

  it('still returns a valid colour once all are used', () => {
    const team = MEMBER_COLORS.map((color) => member({ color }))
    expect(MEMBER_COLORS).toContain(nextMemberColor(team))
  })
})

describe('resolveMembers', () => {
  it('keeps order and skips unknown ids', () => {
    const a = member({ id: 'a' })
    const b = member({ id: 'b' })
    const byId = new Map([
      ['a', a],
      ['b', b],
    ])
    expect(resolveMembers(['b', 'gone', 'a'], byId)).toEqual([b, a])
  })
})

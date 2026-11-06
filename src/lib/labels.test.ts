import { describe, expect, it } from 'vitest'
import { isLabelNameTaken, resolveLabels } from './labels'
import type { Label } from './types'

function label(id: string, name = 'Name'): Label {
  return { id, name, color: '#5b5bd6', user_id: 'user', created_at: '2026-01-01T00:00:00Z' }
}

describe('resolveLabels', () => {
  it('keeps order and skips deleted labels', () => {
    const a = label('a')
    const b = label('b')
    const byId = new Map([
      ['a', a],
      ['b', b],
    ])
    expect(resolveLabels(['b', 'gone', 'a'], byId)).toEqual([b, a])
  })
})

describe('isLabelNameTaken', () => {
  const labels = [label('a', 'Bug'), label('b', 'Feature')]

  it('ignores case and outer spaces', () => {
    expect(isLabelNameTaken('  bUG ', labels)).toBe(true)
    expect(isLabelNameTaken('Bugfix', labels)).toBe(false)
  })

  it('lets a label keep its own name when edited', () => {
    expect(isLabelNameTaken('bug', labels, 'a')).toBe(false)
    expect(isLabelNameTaken('feature', labels, 'a')).toBe(true)
  })
})

import { describe, it, expect } from 'vitest'
import en from './en'
import fr from './fr'

/** Keys used in Repertoire.tsx */
const REPERTOIRE_KEYS = [
  'repertoire.title',
  'repertoire.flat',
  'repertoire.grouped',
  'repertoire.groupByComposer',
  'repertoire.groupByOpus',
  'repertoire.groupByComposerAndOpus',
  'repertoire.addPiece',
  'repertoire.allStatuses',
  'repertoire.allComposers',
  'repertoire.searchPlaceholder',
  'repertoire.colTitle',
  'repertoire.colComposer',
  'repertoire.colOpus',
  'repertoire.colNumber',
  'repertoire.colDifficulty',
  'repertoire.colStatus',
  'repertoire.colLastPlayed',
  'repertoire.noPiecesTitle',
  'repertoire.noMatchFilters',
  'repertoire.addFirstPiece',
  'status.wishlist',
  'status.learning',
  'status.active',
  'status.shelved',
  'common.never',
] as const

function resolve(obj: Record<string, unknown>, key: string): string | undefined {
  const parts = key.split('.')
  let current: unknown = obj
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current as string | undefined
}

describe('repertoire i18n keys', () => {
  describe('English', () => {
    for (const key of REPERTOIRE_KEYS) {
      it(`key "${key}" resolves to a non-empty string`, () => {
        const val = resolve(en as unknown as Record<string, unknown>, key)
        expect(val).toBeDefined()
        expect(typeof val).toBe('string')
        expect(val!.trim()).not.toBe('')
      })
    }
  })

  describe('French', () => {
    for (const key of REPERTOIRE_KEYS) {
      it(`key "${key}" resolves to a non-empty string`, () => {
        const val = resolve(fr as unknown as Record<string, unknown>, key)
        expect(val).toBeDefined()
        expect(typeof val).toBe('string')
        expect(val!.trim()).not.toBe('')
      })
    }
  })
})

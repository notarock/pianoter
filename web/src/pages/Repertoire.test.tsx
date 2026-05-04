import { screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Repertoire from './Repertoire'
import { renderWithProviders, setAuthState, clearAuthState } from '../test-utils'
import * as client from '../api/client'
import type { Piece, Composer } from '../api/types'

vi.mock('mantine-datatable', () => ({
  DataTable: ({ records, columns, noRecordsText }: any) => {
    if (!records?.length) return <p>{noRecordsText ?? 'No records'}</p>
    return (
      <table>
        <thead><tr>{columns.map((c: any) => <th key={c.accessor}>{c.title}</th>)}</tr></thead>
        <tbody>{records.map((r: any) => (
          <tr key={r.id}>{columns.map((c: any) => (
            <td key={c.accessor}>{c.render ? c.render(r) : String(r[c.accessor] ?? '')}</td>
          ))}</tr>
        ))}</tbody>
      </table>
    )
  },
}))

vi.mock('../api/client', () => ({
  authApi: {},
  api: {
    pieces: { list: vi.fn() },
    composers: { list: vi.fn() },
  },
}))

const beethoven: Composer = { id: 2, user_id: 0, name: 'Ludwig van Beethoven', nationality: 'German', born_year: 1770, died_year: 1827 }

const makePiece = (overrides: Partial<Piece> = {}): Piece => ({
  id: 1,
  title: 'Moonlight Sonata',
  opus: '',
  number: '',
  composer_id: 2,
  composer: beethoven,
  difficulty: 7,
  status: 'active',
  started_at: '2026-01-01T00:00:00Z',
  last_played_at: null,
  current_level: '',
  notes: '',
  ...overrides,
})

// ── Pure grouping logic tests ──────────────────────────────────────

function groupPieces(pieces: Piece[], groupBy: 'composer' | 'opus' | 'composer-opus') {
  const groups: Record<string, Piece[]> = {}
  for (const p of pieces) {
    let key: string
    if (groupBy === 'composer') {
      key = p.composer?.name || '(no composer)'
    } else if (groupBy === 'opus') {
      key = p.opus
        ? (p.opus.startsWith('Op.') || p.opus.startsWith('op.') ? p.opus : `Op. ${p.opus}`)
        : '(no opus)'
    } else {
      const composer = p.composer?.name || '(no composer)'
      const opus = p.opus
        ? (p.opus.startsWith('Op.') || p.opus.startsWith('op.') ? p.opus : `Op. ${p.opus}`)
        : '(no opus)'
      key = `${composer} — ${opus}`
    }
    if (!groups[key]) groups[key] = []
    groups[key].push(p)
  }
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, pieces]) => ({ name, pieces }))
}

describe('groupPieces', () => {
  it('groups pieces by composer', () => {
    const pieces: Piece[] = [
      makePiece({ id: 1, title: 'Moonlight Sonata' }),
      makePiece({ id: 2, title: 'Für Elise', composer: { ...beethoven, id: 3 } }),
    ]
    const result = groupPieces(pieces, 'composer')
    // Both have "Ludwig van Beethoven" as name, so they group together
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Ludwig van Beethoven')
    expect(result[0].pieces).toHaveLength(2)
  })

  it('groups pieces with same composer together', () => {
    const pieces: Piece[] = [
      makePiece({ id: 1, title: 'Moonlight Sonata' }),
      makePiece({ id: 2, title: 'Appassionata' }),
    ]
    const result = groupPieces(pieces, 'composer')
    expect(result).toHaveLength(1)
    expect(result[0].pieces).toHaveLength(2)
  })

  it('groups pieces by opus', () => {
    const pieces: Piece[] = [
      makePiece({ id: 1, title: 'Moonlight Sonata', opus: 'Op. 27 No. 2' }),
      makePiece({ id: 2, title: 'Waldstein', opus: 'Op. 53' }),
    ]
    const result = groupPieces(pieces, 'opus')
    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('Op. 27 No. 2')
    expect(result[0].pieces).toHaveLength(1)
    expect(result[1].name).toBe('Op. 53')
    expect(result[1].pieces).toHaveLength(1)
  })

  it('groups pieces with same opus together', () => {
    const pieces: Piece[] = [
      makePiece({ id: 1, title: 'Moonlight Sonata', opus: 'Op. 27' }),
      makePiece({ id: 2, title: 'Nocturne', opus: 'Op. 27' }),
    ]
    const result = groupPieces(pieces, 'opus')
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Op. 27')
    expect(result[0].pieces).toHaveLength(2)
  })

  it('groups pieces by composer + opus', () => {
    const pieces: Piece[] = [
      makePiece({ id: 1, title: 'Moonlight Sonata', composer: beethoven, opus: 'Op. 27 No. 2' }),
      makePiece({ id: 2, title: 'Für Elise', composer: { ...beethoven, id: 3 }, opus: 'Op. 27 No. 2' }),
      makePiece({ id: 3, title: 'Waldstein', composer: beethoven, opus: 'Op. 53' }),
    ]
    const result = groupPieces(pieces, 'composer-opus')
    expect(result).toHaveLength(2)
    // Same composer + same opus = 1 group
    const moonlightEliseGroup = result.find(g => g.pieces.some(p => p.title === 'Moonlight Sonata'))
    expect(moonlightEliseGroup?.pieces).toHaveLength(2)
    // Different opus = separate group
    const waldsteinGroup = result.find(g => g.pieces.some(p => p.title === 'Waldstein'))
    expect(waldsteinGroup?.pieces).toHaveLength(1)
  })

  it('sorts groups alphabetically', () => {
    const pieces: Piece[] = [
      makePiece({ id: 1, title: 'Waldstein', opus: 'Op. 53' }),
      makePiece({ id: 2, title: 'Moonlight Sonata', opus: 'Op. 27' }),
      makePiece({ id: 3, title: 'Pathétique', opus: 'Op. 13' }),
    ]
    const result = groupPieces(pieces, 'opus')
    expect(result[0].name).toBe('Op. 13')
    expect(result[1].name).toBe('Op. 27')
    expect(result[2].name).toBe('Op. 53')
  })

  it('uses fallback for missing composer', () => {
    const pieces: Piece[] = [
      makePiece({ id: 1, title: 'Untitled', composer: undefined as any }),
    ]
    const result = groupPieces(pieces, 'composer')
    expect(result[0].name).toBe('(no composer)')
    expect(result[0].pieces).toHaveLength(1)
  })

  it('uses fallback for missing opus', () => {
    const pieces: Piece[] = [
      makePiece({ id: 1, title: 'Untitled', opus: '' }),
    ]
    const result = groupPieces(pieces, 'opus')
    expect(result[0].name).toBe('(no opus)')
    expect(result[0].pieces).toHaveLength(1)
  })

  it('returns empty array for no pieces', () => {
    const result = groupPieces([], 'composer')
    expect(result).toEqual([])
  })

  it('adds Op. prefix when missing', () => {
    const pieces: Piece[] = [
      makePiece({ id: 1, title: 'Test', opus: '27' }),
    ]
    const result = groupPieces(pieces, 'opus')
    expect(result[0].name).toBe('Op. 27')
  })

  it('preserves existing Op. prefix', () => {
    const pieces: Piece[] = [
      makePiece({ id: 1, title: 'Test', opus: 'Op. 27' }),
    ]
    const result = groupPieces(pieces, 'opus')
    expect(result[0].name).toBe('Op. 27')
  })

  it('groups pieces without opus under "(no opus)"', () => {
    const pieces: Piece[] = [
      makePiece({ id: 1, title: 'Test 1', opus: '' }),
      makePiece({ id: 2, title: 'Test 2', opus: 'Op. 27' }),
      makePiece({ id: 3, title: 'Test 3', opus: '' }),
    ]
    const result = groupPieces(pieces, 'opus')
    const noOpusGroup = result.find(g => g.name === '(no opus)')
    expect(noOpusGroup?.pieces).toHaveLength(2)
  })

  it('sorts composer-opus groups by composer then opus', () => {
    const pieces: Piece[] = [
      makePiece({ id: 1, title: 'B Piece', composer: { ...beethoven, id: 1 }, opus: 'Op. 53' }),
      makePiece({ id: 2, title: 'A Piece', composer: { ...beethoven, id: 1 }, opus: 'Op. 27' }),
      makePiece({ id: 3, title: 'C Piece', composer: { ...beethoven, id: 2 }, opus: 'Op. 1' }),
    ]
    const result = groupPieces(pieces, 'composer-opus')
    expect(result[0].name).toBe('Ludwig van Beethoven — Op. 1')
    expect(result[1].name).toBe('Ludwig van Beethoven — Op. 27')
    expect(result[2].name).toBe('Ludwig van Beethoven — Op. 53')
  })

  it('handles mixed opus formats (op. vs Op.)', () => {
    const pieces: Piece[] = [
      makePiece({ id: 1, title: 'Test 1', opus: 'op. 27' }),
      makePiece({ id: 2, title: 'Test 2', opus: 'Op. 27' }),
    ]
    const result = groupPieces(pieces, 'opus')
    expect(result).toHaveLength(2)
  })
})

// ── Integration tests ──────────────────────────────────────────────

describe('Repertoire page', () => {
  beforeEach(() => {
    clearAuthState()
    setAuthState()
    vi.clearAllMocks()
    vi.mocked(client.api.composers.list).mockResolvedValue([beethoven])
    vi.mocked(client.api.pieces.list).mockResolvedValue([])
  })

  it('renders the Repertoire heading', async () => {
    renderWithProviders(<Repertoire />)
    expect(await screen.findByRole('heading', { name: /repertoire/i })).toBeInTheDocument()
  })

  it('renders an "Add Piece" button linking to /pieces/new', async () => {
    renderWithProviders(<Repertoire />)
    const link = await screen.findByRole('link', { name: /add piece/i })
    expect(link).toHaveAttribute('href', '/pieces/new')
  })

  it('renders a status filter dropdown with all status options', async () => {
    renderWithProviders(<Repertoire />)
    await screen.findByRole('heading', { name: /repertoire/i })
    expect(screen.getByRole('option', { name: /wishlist/i, hidden: true })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /learning/i, hidden: true })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /active/i, hidden: true })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /shelved/i, hidden: true })).toBeInTheDocument()
  })

  it('renders the composer filter dropdown', async () => {
    renderWithProviders(<Repertoire />)
    expect(await screen.findByText(/ludwig van beethoven/i)).toBeInTheDocument()
  })

  it('renders table column headers', async () => {
    vi.mocked(client.api.pieces.list).mockResolvedValue([makePiece()])
    renderWithProviders(<Repertoire />)
    const toggle = await screen.findByRole('radiogroup')
    const flatOption = toggle.querySelector('input[value="flat"]') as HTMLInputElement
    fireEvent.click(flatOption)
    expect(await screen.findByRole('columnheader', { name: /title/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /composer/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /difficulty/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /status/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /last played/i })).toBeInTheDocument()
  })

  it('renders empty state when no pieces exist', async () => {
    renderWithProviders(<Repertoire />)
    const toggle = await screen.findByRole('radiogroup')
    const flatOption = toggle.querySelector('input[value="flat"]') as HTMLInputElement
    fireEvent.click(flatOption)
    expect(await screen.findByText(/no pieces yet/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /\+ add piece/i })).toBeInTheDocument()
  })

  it('renders a row for each piece with a link to its detail page', async () => {
    vi.mocked(client.api.pieces.list).mockResolvedValue([makePiece({ id: 5 })])
    renderWithProviders(<Repertoire />)
    const toggle = await screen.findByRole('radiogroup')
    const flatOption = toggle.querySelector('input[value="flat"]') as HTMLInputElement
    fireEvent.click(flatOption)

    const link = await screen.findByRole('link', { name: /moonlight sonata/i })
    expect(link).toHaveAttribute('href', '/pieces/5')
    expect(screen.getAllByText('Ludwig van Beethoven').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('7/10')).toBeInTheDocument()
    expect(screen.getAllByText(/active/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/never/i)).toBeInTheDocument()
  })

  it('shows "no pieces match your filters" when filters are active but no results', async () => {
    renderWithProviders(<Repertoire />)
    const toggle = await screen.findByRole('radiogroup')
    const flatOption = toggle.querySelector('input[value="flat"]') as HTMLInputElement
    fireEvent.click(flatOption)
    const wishlistOption = screen.getByRole('option', { name: /wishlist/i, hidden: true })
    const statusSelect = (wishlistOption as HTMLElement).closest('select')!
    fireEvent.change(statusSelect, { target: { value: 'wishlist' } })
    expect(await screen.findByText(/no pieces match your filters/i)).toBeInTheDocument()
  })

  it('renders the flat/grouped toggle', async () => {
    renderWithProviders(<Repertoire />)
    expect(await screen.findByRole('radiogroup')).toBeInTheDocument()
  })

  it('defaults to grouped view', async () => {
    renderWithProviders(<Repertoire />)
    const toggle = await screen.findByRole('radiogroup')
    const groupedChecked = toggle.querySelector('input[value="grouped"]') as HTMLInputElement
    const flatChecked = toggle.querySelector('input[value="flat"]') as HTMLInputElement
    expect(groupedChecked.checked).toBe(true)
    expect(flatChecked.checked).toBe(false)
  })

  it('toggling to flat hides the grouped view and shows flat table', async () => {
    vi.mocked(client.api.pieces.list).mockResolvedValue([makePiece()])
    renderWithProviders(<Repertoire />)
    const toggle = await screen.findByRole('radiogroup')
    const flatOption = toggle.querySelector('input[value="flat"]') as HTMLInputElement
    fireEvent.click(flatOption)
    expect(await screen.findByRole('columnheader', { name: /title/i })).toBeInTheDocument()
  })

  it('toggling to flat hides group-by options', async () => {
    vi.mocked(client.api.pieces.list).mockResolvedValue([makePiece()])
    renderWithProviders(<Repertoire />)
    const toggle = await screen.findByRole('radiogroup')
    const flatOption = toggle.querySelector('input[value="flat"]') as HTMLInputElement
    fireEvent.click(flatOption)
    const groupedChecked = toggle.querySelector('input[value="grouped"]') as HTMLInputElement
    const flatChecked = toggle.querySelector('input[value="flat"]') as HTMLInputElement
    expect(flatChecked.checked).toBe(true)
    expect(groupedChecked.checked).toBe(false)
  })

  it('search matches opus and number fields', async () => {
    vi.mocked(client.api.pieces.list).mockResolvedValue([
      makePiece({ id: 1, title: 'Moonlight Sonata', opus: 'Op. 27' }),
      makePiece({ id: 2, title: 'Fur Elise', number: 'No. 5' }),
      makePiece({ id: 3, title: 'Waldstein' }),
    ])
    renderWithProviders(<Repertoire />)
    await screen.findByRole('heading', { name: /repertoire/i })
    const searchInput = screen.getByPlaceholderText(/search/i)
    fireEvent.change(searchInput, { target: { value: 'Op. 27' } })
    expect(await screen.findByText('Moonlight Sonata')).toBeInTheDocument()
    expect(screen.queryByText('Fur Elise')).not.toBeInTheDocument()
    expect(screen.queryByText('Waldstein')).not.toBeInTheDocument()
  })

  describe('grouped view', () => {
    it('renders group headers when in grouped mode', async () => {
      vi.mocked(client.api.pieces.list).mockResolvedValue([
        makePiece({ id: 1, title: 'Moonlight Sonata' }),
        makePiece({ id: 2, title: 'Fur Elise' }),
      ])
      renderWithProviders(<Repertoire />)
      // In grouped mode with composer-opus grouping, check the group-by dropdown is visible
      const toggle = await screen.findByRole('radiogroup')
      const groupedOption = toggle.querySelector('input[value="grouped"]') as HTMLInputElement
      expect(groupedOption.checked).toBe(true)
    })

    it('shows piece count next to group name', async () => {
      vi.mocked(client.api.pieces.list).mockResolvedValue([
        makePiece({ id: 1, title: 'Moonlight Sonata' }),
        makePiece({ id: 2, title: 'Fur Elise' }),
        makePiece({ id: 3, title: 'Waldstein' }),
      ])
      renderWithProviders(<Repertoire />)
      expect(await screen.findByText('(3)')).toBeInTheDocument()
    })

    it('shows group-by dropdown options when grouped', async () => {
      vi.mocked(client.api.pieces.list).mockResolvedValue([makePiece()])
      renderWithProviders(<Repertoire />)
      expect(screen.getByText('Composer + Opus')).toBeInTheDocument()
      expect(screen.getByText('Composer')).toBeInTheDocument()
      expect(screen.getByText('Opus')).toBeInTheDocument()
    })

    it('hides group-by dropdown options when toggled to flat', async () => {
      vi.mocked(client.api.pieces.list).mockResolvedValue([makePiece()])
      renderWithProviders(<Repertoire />)
      const toggle = await screen.findByRole('radiogroup')
      const flatOption = toggle.querySelector('input[value="flat"]') as HTMLInputElement
      fireEvent.click(flatOption)
      expect(screen.queryByText('Composer + Opus')).not.toBeInTheDocument()
    })

    it('group-by dropdown defaults to "Composer + Opus"', async () => {
      vi.mocked(client.api.pieces.list).mockResolvedValue([makePiece()])
      renderWithProviders(<Repertoire />)
      const selects = screen.getAllByRole('combobox')
      const groupBySelect = selects.find(s =>
        Array.from(s.querySelectorAll('option')).some(o => o.value === 'composer-opus'),
      )
      expect(groupBySelect).toBeDefined()
      const selectedOption = groupBySelect!.querySelector('option:checked') as HTMLOptionElement | null
      expect(selectedOption?.value).toBe('composer-opus')
    })

    it('opus groups show "Op." prefix', async () => {
      vi.mocked(client.api.pieces.list).mockResolvedValue([
        makePiece({ id: 1, title: 'Moonlight Sonata', opus: 'Op. 27 No. 2' }),
        makePiece({ id: 2, title: 'Waldstein', opus: 'Op. 53' }),
      ])
      renderWithProviders(<Repertoire />)
      expect(screen.getByText('Opus')).toBeInTheDocument()
    })

    it('groups pieces with same composer-opus under same header', async () => {
      const pieces = [
        makePiece({ id: 1, title: 'Moonlight Sonata', opus: 'Op. 27' }),
        makePiece({ id: 2, title: 'Fur Elise', opus: 'Op. 27' }),
      ]
      const result = groupPieces(pieces, 'composer-opus')
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Ludwig van Beethoven — Op. 27')
      expect(result[0].pieces).toHaveLength(2)
    })

    it('groups pieces with different composer-opus under separate headers', async () => {
      const pieces = [
        makePiece({ id: 1, title: 'Moonlight Sonata', opus: 'Op. 27' }),
        makePiece({ id: 2, title: 'Waldstein', opus: 'Op. 53' }),
      ]
      const result = groupPieces(pieces, 'composer-opus')
      expect(result).toHaveLength(2)
      expect(result.map(g => g.name)).toContain('Ludwig van Beethoven — Op. 27')
      expect(result.map(g => g.name)).toContain('Ludwig van Beethoven — Op. 53')
    })

    it('shows pagination when groupedItems exceed PAGE_SIZE', async () => {
      const manyPieces = Array.from({ length: 25 }, (_, i) =>
        makePiece({ id: i + 1, title: `Piece ${i + 1}`, opus: `Op. ${i + 1}` }),
      )
      vi.mocked(client.api.pieces.list).mockResolvedValue(manyPieces)
      renderWithProviders(<Repertoire />)
      expect(await screen.findByText(/1 \/ 2/)).toBeInTheDocument()
    })

    it('hides pagination when groupedItems <= PAGE_SIZE', async () => {
      vi.mocked(client.api.pieces.list).mockResolvedValue([
        makePiece({ id: 1, title: 'Moonlight Sonata' }),
        makePiece({ id: 2, title: 'Fur Elise' }),
      ])
      renderWithProviders(<Repertoire />)
      expect(screen.queryByText(/1 \/ 1/)).not.toBeInTheDocument()
    })
  })

  describe('flat view', () => {
    it('shows all column headers in flat view', async () => {
      vi.mocked(client.api.pieces.list).mockResolvedValue([makePiece()])
      renderWithProviders(<Repertoire />)
      const toggle = await screen.findByRole('radiogroup')
      const flatOption = toggle.querySelector('input[value="flat"]') as HTMLInputElement
      fireEvent.click(flatOption)
      expect(await screen.findByRole('columnheader', { name: /title/i })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: /composer/i })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: /opus/i })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: /no\./i })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: /difficulty/i })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: /status/i })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: /last played/i })).toBeInTheDocument()
    })

    it('hides group-by dropdown in flat view', async () => {
      vi.mocked(client.api.pieces.list).mockResolvedValue([makePiece()])
      renderWithProviders(<Repertoire />)
      const toggle = await screen.findByRole('radiogroup')
      const flatOption = toggle.querySelector('input[value="flat"]') as HTMLInputElement
      fireEvent.click(flatOption)
      expect(screen.queryByText('Composer + Opus')).not.toBeInTheDocument()
    })

    it('shows "Add First Piece" button when empty', async () => {
      renderWithProviders(<Repertoire />)
      const toggle = await screen.findByRole('radiogroup')
      const flatOption = toggle.querySelector('input[value="flat"]') as HTMLInputElement
      fireEvent.click(flatOption)
      expect(await screen.findByText(/add your first piece/i)).toBeInTheDocument()
    })

    it('"Add First Piece" button navigates to /pieces/new', async () => {
      renderWithProviders(<Repertoire />)
      expect(await screen.findByRole('button', { name: /add your first piece/i })).toBeInTheDocument()
    })
  })

  describe('filter + search interactions', () => {
    it('filters by status and shows matching pieces', async () => {
      vi.mocked(client.api.pieces.list).mockImplementation(async (params: any) => {
        if (params?.status === 'wishlist') return [makePiece({ id: 2, title: 'Wishlist Piece', status: 'wishlist' })]
        return [
          makePiece({ id: 1, title: 'Active Piece', status: 'active' }),
          makePiece({ id: 2, title: 'Wishlist Piece', status: 'wishlist' }),
        ]
      })
      renderWithProviders(<Repertoire />)
      const selects = screen.getAllByRole('combobox')
      const statusSelect = selects.find(s =>
        Array.from(s.querySelectorAll('option')).some(o => o.value === ''),
      )!
      fireEvent.change(statusSelect, { target: { value: 'wishlist' } })
      expect(await screen.findByText('Wishlist Piece')).toBeInTheDocument()
      expect(screen.queryByText('Active Piece')).not.toBeInTheDocument()
    })

    it('clears status filter and shows all pieces', async () => {
      vi.mocked(client.api.pieces.list).mockImplementation(async (params: any) => {
        if (params?.status === 'wishlist') return [makePiece({ id: 2, title: 'Wishlist Piece', status: 'wishlist' })]
        return [
          makePiece({ id: 1, title: 'Active Piece', status: 'active' }),
          makePiece({ id: 2, title: 'Wishlist Piece', status: 'wishlist' }),
        ]
      })
      renderWithProviders(<Repertoire />)
      const selects = screen.getAllByRole('combobox')
      const statusSelect = selects.find(s =>
        Array.from(s.querySelectorAll('option')).some(o => o.value === 'wishlist'),
      )!
      fireEvent.change(statusSelect, { target: { value: 'wishlist' } })
      expect(await screen.findByText('Wishlist Piece')).toBeInTheDocument()
      fireEvent.change(statusSelect, { target: { value: '' } })
      expect(await screen.findByText('Active Piece')).toBeInTheDocument()
    })

    it('search filters pieces by title', async () => {
      vi.mocked(client.api.pieces.list).mockResolvedValue([
        makePiece({ id: 1, title: 'Moonlight Sonata' }),
        makePiece({ id: 2, title: 'Für Elise' }),
        makePiece({ id: 3, title: 'Clair de Lune' }),
      ])
      renderWithProviders(<Repertoire />)
      const searchInput = screen.getByPlaceholderText(/search/i)
      fireEvent.change(searchInput, { target: { value: 'Moonlight' } })
      expect(await screen.findByText('Moonlight Sonata')).toBeInTheDocument()
      expect(screen.queryByText('Für Elise')).not.toBeInTheDocument()
      expect(screen.queryByText('Clair de Lune')).not.toBeInTheDocument()
    })

    it('search is case insensitive', async () => {
      vi.mocked(client.api.pieces.list).mockResolvedValue([
        makePiece({ id: 1, title: 'Moonlight Sonata' }),
        makePiece({ id: 2, title: 'Für Elise' }),
      ])
      renderWithProviders(<Repertoire />)
      const searchInput = screen.getByPlaceholderText(/search/i)
      fireEvent.change(searchInput, { target: { value: 'moonlight' } })
      expect(await screen.findByText('Moonlight Sonata')).toBeInTheDocument()
    })

    it('clearing search shows all pieces again', async () => {
      vi.mocked(client.api.pieces.list).mockResolvedValue([
        makePiece({ id: 1, title: 'Moonlight Sonata' }),
        makePiece({ id: 2, title: 'Für Elise' }),
      ])
      renderWithProviders(<Repertoire />)
      const searchInput = screen.getByPlaceholderText(/search/i)
      fireEvent.change(searchInput, { target: { value: 'Moonlight' } })
      expect(await screen.findByText('Moonlight Sonata')).toBeInTheDocument()
      fireEvent.change(searchInput, { target: { value: '' } })
      expect(await screen.findByText('Für Elise')).toBeInTheDocument()
    })

    it('filters by composer and shows matching pieces', async () => {
      vi.mocked(client.api.pieces.list).mockImplementation(async (params: any) => {
        if (params?.composer_id === 99) return []
        return [
          makePiece({ id: 1, title: 'Moonlight Sonata' }),
          makePiece({ id: 2, title: 'Für Elise' }),
        ]
      })
      renderWithProviders(<Repertoire />)
      const selects = screen.getAllByRole('combobox')
      const composerSelect = selects.find(s =>
        Array.from(s.querySelectorAll('option')).some(o => o.value === ''),
      )!
      fireEvent.change(composerSelect, { target: { value: '2' } })
      expect(await screen.findByText('Moonlight Sonata')).toBeInTheDocument()
    })

    it('clearing composer filter shows all pieces', async () => {
      vi.mocked(client.api.pieces.list).mockImplementation(async (params: any) => {
        if (params?.composer_id === 99) return []
        return [
          makePiece({ id: 1, title: 'Moonlight Sonata' }),
          makePiece({ id: 2, title: 'Für Elise' }),
        ]
      })
      renderWithProviders(<Repertoire />)
      const selects = screen.getAllByRole('combobox')
      const composerSelect = selects.find(s =>
        Array.from(s.querySelectorAll('option')).some(o => o.value === ''),
      )!
      fireEvent.change(composerSelect, { target: { value: '2' } })
      fireEvent.change(composerSelect, { target: { value: '' } })
      expect(await screen.findByText('Moonlight Sonata')).toBeInTheDocument()
    })

    it('combines status and composer filters', async () => {
      vi.mocked(client.api.pieces.list).mockImplementation(async (params: any) => {
        if (params?.status === 'wishlist' && params?.composer_id === 2) {
          return [makePiece({ id: 2, title: 'Wishlist Beethoven', status: 'wishlist', composer_id: 2 })]
        }
        return []
      })
      renderWithProviders(<Repertoire />)
      await screen.findByText(/ludwig van beethoven/i)
      const toggle = await screen.findByRole('radiogroup')
      const flatOption = toggle.querySelector('input[value="flat"]') as HTMLInputElement
      fireEvent.click(flatOption)
      const selects = screen.getAllByRole('combobox')
      const statusSelect = selects.find(s =>
        Array.from(s.querySelectorAll('option')).some(o => o.value === 'wishlist'),
      )!
      fireEvent.change(statusSelect, { target: { value: 'wishlist' } })
      const composerSelect = selects[1] as HTMLSelectElement
      fireEvent.change(composerSelect, { target: { value: '2' } })
      expect(await screen.findByText('Wishlist Beethoven')).toBeInTheDocument()
    })

    it('search does not match composer name', async () => {
      vi.mocked(client.api.pieces.list).mockResolvedValue([
        makePiece({ id: 1, title: 'Moonlight Sonata' }),
        makePiece({ id: 2, title: 'Clair de Lune' }),
      ])
      renderWithProviders(<Repertoire />)
      const toggle = await screen.findByRole('radiogroup')
      const flatOption = toggle.querySelector('input[value="flat"]') as HTMLInputElement
      fireEvent.click(flatOption)
      const searchInput = screen.getByPlaceholderText(/search/i)
      fireEvent.change(searchInput, { target: { value: 'Beethoven' } })
      expect(screen.queryByText('Moonlight Sonata')).not.toBeInTheDocument()
      expect(screen.queryByText('Clair de Lune')).not.toBeInTheDocument()
    })

    it('search matches opus field', async () => {
      vi.mocked(client.api.pieces.list).mockResolvedValue([
        makePiece({ id: 1, title: 'Moonlight Sonata', opus: 'Op. 27 No. 2' }),
        makePiece({ id: 2, title: 'Waldstein', opus: 'Op. 53' }),
      ])
      renderWithProviders(<Repertoire />)
      const toggle = await screen.findByRole('radiogroup')
      const flatOption = toggle.querySelector('input[value="flat"]') as HTMLInputElement
      fireEvent.click(flatOption)
      const searchInput = screen.getByPlaceholderText(/search/i)
      fireEvent.change(searchInput, { target: { value: 'Op. 27' } })
      expect(await screen.findByText('Moonlight Sonata')).toBeInTheDocument()
      expect(screen.queryByText('Waldstein')).not.toBeInTheDocument()
    })

    it('search matches number field', async () => {
      vi.mocked(client.api.pieces.list).mockResolvedValue([
        makePiece({ id: 1, title: 'Moonlight Sonata', number: '2' }),
        makePiece({ id: 2, title: 'Waldstein', number: '53' }),
      ])
      renderWithProviders(<Repertoire />)
      const toggle = await screen.findByRole('radiogroup')
      const flatOption = toggle.querySelector('input[value="flat"]') as HTMLInputElement
      fireEvent.click(flatOption)
      const searchInput = screen.getByPlaceholderText(/search/i)
      fireEvent.change(searchInput, { target: { value: '2' } })
      expect(await screen.findByText('Moonlight Sonata')).toBeInTheDocument()
      expect(screen.queryByText('Waldstein')).not.toBeInTheDocument()
    })

    it('search combined with status filter narrows results', async () => {
      vi.mocked(client.api.pieces.list).mockImplementation(async (params: any) => {
        if (params?.status === 'active') {
          return [makePiece({ id: 1, title: 'Active Moonlight', opus: 'Op. 27' })]
        }
        return []
      })
      renderWithProviders(<Repertoire />)
      const toggle = await screen.findByRole('radiogroup')
      const flatOption = toggle.querySelector('input[value="flat"]') as HTMLInputElement
      fireEvent.click(flatOption)
      const selects = screen.getAllByRole('combobox')
      const statusSelect = selects.find(s =>
        Array.from(s.querySelectorAll('option')).some(o => o.value === 'active'),
      )!
      fireEvent.change(statusSelect, { target: { value: 'active' } })
      const searchInput = screen.getByPlaceholderText(/search/i)
      fireEvent.change(searchInput, { target: { value: 'Moonlight' } })
      expect(await screen.findByText('Active Moonlight')).toBeInTheDocument()
    })

    it('search combined with composer filter narrows results', async () => {
      vi.mocked(client.api.pieces.list).mockImplementation(async (params: any) => {
        if (params?.composer_id === 2) {
          return [makePiece({ id: 1, title: 'Beethoven Moonlight', opus: 'Op. 27' })]
        }
        return []
      })
      renderWithProviders(<Repertoire />)
      await screen.findByText(/ludwig van beethoven/i)
      const toggle = await screen.findByRole('radiogroup')
      const flatOption = toggle.querySelector('input[value="flat"]') as HTMLInputElement
      fireEvent.click(flatOption)
      const selects = screen.getAllByRole('combobox')
      const composerSelect = selects[1] as HTMLSelectElement
      fireEvent.change(composerSelect, { target: { value: '2' } })
      const searchInput = screen.getByPlaceholderText(/search/i)
      fireEvent.change(searchInput, { target: { value: 'Moonlight' } })
      expect(await screen.findByText('Beethoven Moonlight')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('handles pieces with empty title gracefully', async () => {
      vi.mocked(client.api.pieces.list).mockResolvedValue([
        makePiece({ id: 1, title: '' }),
      ])
      renderWithProviders(<Repertoire />)
      const toggle = await screen.findByRole('radiogroup')
      const flatOption = toggle.querySelector('input[value="flat"]') as HTMLInputElement
      fireEvent.click(flatOption)
      expect(await screen.findByRole('columnheader', { name: /title/i })).toBeInTheDocument()
    })

    it('handles pieces with no composer gracefully', async () => {
      vi.mocked(client.api.pieces.list).mockResolvedValue([
        makePiece({ id: 1, title: 'Untitled', composer: undefined as any }),
      ])
      renderWithProviders(<Repertoire />)
      const toggle = await screen.findByRole('radiogroup')
      const flatOption = toggle.querySelector('input[value="flat"]') as HTMLInputElement
      fireEvent.click(flatOption)
      expect(await screen.findByRole('columnheader', { name: /composer/i })).toBeInTheDocument()
    })

    it('handles pieces with special characters in title', async () => {
      vi.mocked(client.api.pieces.list).mockResolvedValue([
        makePiece({ id: 1, title: "Für Elise" }),
        makePiece({ id: 2, title: 'Piano Sonata No. 17 (The Tempest)' }),
      ])
      renderWithProviders(<Repertoire />)
      const toggle = await screen.findByRole('radiogroup')
      const flatOption = toggle.querySelector('input[value="flat"]') as HTMLInputElement
      fireEvent.click(flatOption)
      expect(await screen.findByText('Für Elise')).toBeInTheDocument()
      expect(await screen.findByText('Piano Sonata No. 17 (The Tempest)')).toBeInTheDocument()
    })

    it('handles pagination with exactly PAGE_SIZE items', async () => {
      const exactly20 = Array.from({ length: 20 }, (_, i) =>
        makePiece({ id: i + 1, title: `Piece ${i + 1}` }),
      )
      vi.mocked(client.api.pieces.list).mockResolvedValue(exactly20)
      renderWithProviders(<Repertoire />)
      expect(screen.queryByText(/1 \/ 1/)).not.toBeInTheDocument()
    })

    it('handles empty filter values gracefully', async () => {
      vi.mocked(client.api.pieces.list).mockResolvedValue([
        makePiece({ id: 1, title: 'Test Piece', opus: '', number: '' }),
      ])
      renderWithProviders(<Repertoire />)
      const toggle = await screen.findByRole('radiogroup')
      const flatOption = toggle.querySelector('input[value="flat"]') as HTMLInputElement
      fireEvent.click(flatOption)
      expect(await screen.findByText('Test Piece')).toBeInTheDocument()
    })

    it('handles rapid filter changes without crashing', async () => {
      vi.mocked(client.api.pieces.list).mockResolvedValue([
        makePiece({ id: 1, title: 'Test Piece' }),
      ])
      renderWithProviders(<Repertoire />)
      const toggle = await screen.findByRole('radiogroup')
      const flatOption = toggle.querySelector('input[value="flat"]') as HTMLInputElement
      fireEvent.click(flatOption)
      const searchInput = screen.getByPlaceholderText(/search/i)
      fireEvent.change(searchInput, { target: { value: 'Test' } })
      fireEvent.change(searchInput, { target: { value: 'Other' } })
      fireEvent.change(searchInput, { target: { value: '' } })
      expect(await screen.findByText('Test Piece')).toBeInTheDocument()
    })
  })
})

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
    // Mantine Select renders options in the DOM even when the dropdown is closed
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
    expect(await screen.findByRole('columnheader', { name: /title/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /composer/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /difficulty/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /status/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /last played/i })).toBeInTheDocument()
  })

  it('renders empty state when no pieces exist', async () => {
    renderWithProviders(<Repertoire />)
    expect(await screen.findByText(/no pieces yet/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /\+ add piece/i })).toBeInTheDocument()
  })

  it('renders a row for each piece with a link to its detail page', async () => {
    vi.mocked(client.api.pieces.list).mockResolvedValue([makePiece({ id: 5 })])
    renderWithProviders(<Repertoire />)

    const link = await screen.findByRole('link', { name: /moonlight sonata/i })
    expect(link).toHaveAttribute('href', '/pieces/5')
    // Composer name appears in both the filter dropdown and the table row
    expect(screen.getAllByText('Ludwig van Beethoven').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('7/10')).toBeInTheDocument()
    // "active" appears in both the status filter and the table row
    expect(screen.getAllByText(/active/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/never/i)).toBeInTheDocument()
  })

  it('shows "no pieces match your filters" when filters are active but no results', async () => {
    renderWithProviders(<Repertoire />)
    await screen.findByRole('heading', { name: /repertoire/i })
    // Mantine Select renders options in DOM even when closed; use fireEvent to select one
    const wishlistOption = screen.getByRole('option', { name: /wishlist/i, hidden: true })
    fireEvent.click(wishlistOption)
    expect(await screen.findByText(/no pieces match your filters/i)).toBeInTheDocument()
  })
})

import { screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Dashboard from './Dashboard'
import { renderWithProviders, setAuthState, clearAuthState } from '../test-utils'
import * as client from '../api/client'
import type { Piece } from '../api/types'

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
    pieces: {
      list: vi.fn(),
    },
  },
}))

const makePiece = (overrides: Partial<Piece> = {}): Piece => ({
  id: 1,
  title: 'Moonlight Sonata',
  opus: '',
  number: '',
  composer_id: 2,
  composer: { id: 2, user_id: 0, name: 'Beethoven', nationality: 'German', born_year: 1770, died_year: 1827 },
  difficulty: 7,
  status: 'active',
  started_at: '2026-01-01T00:00:00Z',
  last_played_at: null,
  current_level: '',
  notes: '',
  ...overrides,
})

describe('Dashboard page', () => {
  beforeEach(() => {
    clearAuthState()
    setAuthState('claude')
    vi.clearAllMocks()
    vi.mocked(client.api.pieces.list).mockResolvedValue([])
  })

  it('renders a welcome message with the username', async () => {
    renderWithProviders(<Dashboard />)
    expect(await screen.findByText(/welcome back, claude/i)).toBeInTheDocument()
  })

  it('renders the four status stat cards', async () => {
    renderWithProviders(<Dashboard />)
    expect(await screen.findByText(/wishlist/i)).toBeInTheDocument()
    expect(screen.getByText(/learning/i)).toBeInTheDocument()
    expect(screen.getByText(/active/i)).toBeInTheDocument()
    expect(screen.getByText(/shelved/i)).toBeInTheDocument()
  })

  it('renders the empty-repertoire prompt when there are no pieces', async () => {
    renderWithProviders(<Dashboard />)
    expect(await screen.findByText(/your repertoire is empty/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /go to repertoire/i })).toBeInTheDocument()
  })

  it('renders the "to revisit" section heading', async () => {
    vi.mocked(client.api.pieces.list)
      .mockResolvedValueOnce([])          // stale call
      .mockResolvedValueOnce([makePiece()]) // all call
    renderWithProviders(<Dashboard />)
    expect(await screen.findByText(/to revisit/i)).toBeInTheDocument()
  })

  it('shows "all caught up" when no stale pieces', async () => {
    vi.mocked(client.api.pieces.list)
      .mockResolvedValueOnce([])          // stale call
      .mockResolvedValueOnce([makePiece()]) // all call
    renderWithProviders(<Dashboard />)
    expect(await screen.findByText(/all caught up/i)).toBeInTheDocument()
  })

  it('renders stale pieces in a table with title, composer, last played, status columns', async () => {
    const piece = makePiece({ last_played_at: '2025-01-01T00:00:00Z' })
    vi.mocked(client.api.pieces.list)
      .mockResolvedValueOnce([piece]) // stale call
      .mockResolvedValueOnce([piece]) // all call

    renderWithProviders(<Dashboard />)

    expect(await screen.findByText('Moonlight Sonata')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /title/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /composer/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /last played/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /status/i })).toBeInTheDocument()
  })

  it('renders a link to each stale piece detail page', async () => {
    const piece = makePiece({ id: 42, last_played_at: '2025-01-01T00:00:00Z' })
    vi.mocked(client.api.pieces.list)
      .mockResolvedValueOnce([piece])
      .mockResolvedValueOnce([piece])

    renderWithProviders(<Dashboard />)

    const link = await screen.findByRole('link', { name: /moonlight sonata/i })
    expect(link).toHaveAttribute('href', '/pieces/42')
  })
})

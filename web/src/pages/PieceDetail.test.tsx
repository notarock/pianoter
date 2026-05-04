import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import PieceDetail from './PieceDetail'
import { renderWithRoute, setAuthState, clearAuthState } from '../test-utils'
import * as client from '../api/client'
import type { Piece, PlaySession } from '../api/types'

vi.mock('../api/client', () => ({
  authApi: {},
  api: {
    pieces: { get: vi.fn(), delete: vi.fn() },
    sessions: { list: vi.fn(), create: vi.fn() },
  },
}))

const piece: Piece = {
  id: 1,
  title: 'Moonlight Sonata',
  opus: 'Op. 27 No. 2',
  number: '2',
  composer_id: 2,
  composer: { id: 2, user_id: 0, name: 'Ludwig van Beethoven', nationality: 'German', born_year: 1770, died_year: 1827 },
  difficulty: 7,
  status: 'active',
  started_at: '2026-01-01T00:00:00Z',
  last_played_at: null,
  current_level: '',
  notes: '',
}

const ROUTE = '/pieces/:id'
const ENTRY = '/pieces/1'

describe('PieceDetail page', () => {
  beforeEach(() => {
    clearAuthState()
    setAuthState()
    vi.clearAllMocks()
    vi.mocked(client.api.pieces.get).mockResolvedValue(piece)
    vi.mocked(client.api.sessions.list).mockResolvedValue([])
  })

  it('renders the piece title as the page heading', async () => {
    renderWithRoute(ROUTE, <PieceDetail />, ENTRY)
    expect(await screen.findByRole('heading', { name: /moonlight sonata/i })).toBeInTheDocument()
  })

  it('renders the composer name', async () => {
    renderWithRoute(ROUTE, <PieceDetail />, ENTRY)
    expect(await screen.findByText(/ludwig van beethoven/i)).toBeInTheDocument()
  })

  it('renders difficulty', async () => {
    renderWithRoute(ROUTE, <PieceDetail />, ENTRY)
    expect(await screen.findByText('7/10')).toBeInTheDocument()
  })

  it('renders piece status', async () => {
    renderWithRoute(ROUTE, <PieceDetail />, ENTRY)
    expect(await screen.findByText(/active/i)).toBeInTheDocument()
  })

  it('renders "Never" when last played is null', async () => {
    renderWithRoute(ROUTE, <PieceDetail />, ENTRY)
    expect(await screen.findByText(/never/i)).toBeInTheDocument()
  })

  it('renders an Edit link pointing to the edit page', async () => {
    renderWithRoute(ROUTE, <PieceDetail />, ENTRY)
    await screen.findByRole('heading', { name: /moonlight sonata/i })
    const editLink = screen.getByRole('link', { name: /edit/i })
    expect(editLink).toHaveAttribute('href', '/pieces/1/edit')
  })

  it('renders a Delete button', async () => {
    renderWithRoute(ROUTE, <PieceDetail />, ENTRY)
    expect(await screen.findByRole('button', { name: /delete/i })).toBeInTheDocument()
  })

  it('renders the Practice History section', async () => {
    renderWithRoute(ROUTE, <PieceDetail />, ENTRY)
    expect(await screen.findByRole('heading', { name: /practice history/i })).toBeInTheDocument()
  })

  it('shows "no sessions logged yet" when there are no sessions', async () => {
    renderWithRoute(ROUTE, <PieceDetail />, ENTRY)
    expect(await screen.findByText(/no sessions logged yet/i)).toBeInTheDocument()
  })

  it('renders a Log Practice Session toggle button', async () => {
    renderWithRoute(ROUTE, <PieceDetail />, ENTRY)
    expect(await screen.findByRole('button', { name: /log practice session/i })).toBeInTheDocument()
  })

  it('reveals the session form when Log Practice Session is clicked', async () => {
    renderWithRoute(ROUTE, <PieceDetail />, ENTRY)
    await userEvent.click(await screen.findByRole('button', { name: /log practice session/i }))
    expect(screen.getByPlaceholderText(/notes/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
  })

  it('renders existing sessions in the history list', async () => {
    const session: PlaySession = {
      id: 10,
      piece_id: 1,
      played_at: '2026-03-01T10:00:00Z',
      notes: 'Focused on left hand',
      playing_level: 'hands_separate',
    }
    vi.mocked(client.api.sessions.list).mockResolvedValue([session])
    renderWithRoute(ROUTE, <PieceDetail />, ENTRY)

    expect(await screen.findByText(/focused on left hand/i)).toBeInTheDocument()
    // "Hands separate" appears as a badge AND as a level-up indicator — both are valid
    expect(screen.getAllByText(/hands separate/i).length).toBeGreaterThanOrEqual(1)
  })
})

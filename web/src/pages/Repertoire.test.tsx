import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Repertoire from './Repertoire'
import { renderWithProviders, setAuthState, clearAuthState } from '../test-utils'
import * as client from '../api/client'
import type { Piece, Composer } from '../api/types'

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
    const selects = screen.getAllByRole('combobox')
    expect(selects.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/all statuses/i)).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /wishlist/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /learning/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /active/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /shelved/i })).toBeInTheDocument()
  })

  it('renders the composer filter dropdown', async () => {
    renderWithProviders(<Repertoire />)
    expect(await screen.findByText(/ludwig van beethoven/i)).toBeInTheDocument()
  })

  it('renders table column headers', async () => {
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
    expect(screen.getByRole('button', { name: /add your first piece/i })).toBeInTheDocument()
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
    // select the status filter (first combobox)
    const selects = screen.getAllByRole('combobox')
    await userEvent.selectOptions(selects[0], 'wishlist')
    expect(await screen.findByText(/no pieces match your filters/i)).toBeInTheDocument()
  })
})

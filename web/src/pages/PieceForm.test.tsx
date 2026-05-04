import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import PieceForm from './PieceForm'
import { renderWithRoute, setAuthState, clearAuthState } from '../test-utils'
import * as client from '../api/client'
import type { Composer, Piece } from '../api/types'

vi.mock('../api/client', () => ({
  authApi: {},
  api: {
    composers: { list: vi.fn() },
    pieces: { get: vi.fn(), create: vi.fn(), update: vi.fn() },
  },
}))

const beethoven: Composer = { id: 2, user_id: 0, name: 'Ludwig van Beethoven', nationality: 'German', born_year: 1770, died_year: 1827 }

describe('PieceForm — Add mode', () => {
  beforeEach(() => {
    clearAuthState()
    setAuthState()
    vi.clearAllMocks()
    vi.mocked(client.api.composers.list).mockResolvedValue([beethoven])
  })

  it('renders the "Add Piece" heading', async () => {
    renderWithRoute('/pieces/new', <PieceForm />, '/pieces/new')
    expect(await screen.findByRole('heading', { name: /add piece/i })).toBeInTheDocument()
  })

  it('renders Title, Composer, Difficulty, Status, Started At fields', async () => {
    renderWithRoute('/pieces/new', <PieceForm />, '/pieces/new')
    expect(await screen.findByLabelText(/title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/opus/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/number/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/composer/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/difficulty/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/started at/i)).toBeInTheDocument()
  })

  it('renders an "Add Piece" submit button', async () => {
    renderWithRoute('/pieces/new', <PieceForm />, '/pieces/new')
    expect(await screen.findByRole('button', { name: /^add piece$/i })).toBeInTheDocument()
  })

  it('renders a Cancel button', async () => {
    renderWithRoute('/pieces/new', <PieceForm />, '/pieces/new')
    expect(await screen.findByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('renders status options: Wishlist, Learning, Active, Shelved', async () => {
    renderWithRoute('/pieces/new', <PieceForm />, '/pieces/new')
    await screen.findByRole('heading', { name: /add piece/i })
    expect(screen.getByRole('option', { name: /wishlist/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /learning/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /active/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /shelved/i })).toBeInTheDocument()
  })

  it('populates the composer dropdown with loaded composers', async () => {
    renderWithRoute('/pieces/new', <PieceForm />, '/pieces/new')
    expect(await screen.findByRole('option', { name: /ludwig van beethoven/i })).toBeInTheDocument()
  })

  it('calls api.pieces.create on submission', async () => {
    vi.mocked(client.api.pieces.create).mockResolvedValue({ id: 99 } as Piece)
    renderWithRoute('/pieces/new', <PieceForm />, '/pieces/new')

    await userEvent.type(await screen.findByLabelText(/title/i), 'Für Elise')
    await userEvent.selectOptions(screen.getByLabelText(/composer/i), '2')
    await userEvent.click(screen.getByRole('button', { name: /^add piece$/i }))

    expect(client.api.pieces.create).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Für Elise', opus: '', number: '', composer_id: 2 })
    )
  })

  it('handles typed date string in started_at field', async () => {
    vi.mocked(client.api.pieces.create).mockResolvedValue({ id: 99 } as Piece)
    renderWithRoute('/pieces/new', <PieceForm />, '/pieces/new')

    await userEvent.type(await screen.findByLabelText(/title/i), 'Für Elise')
    await userEvent.selectOptions(screen.getByLabelText(/composer/i), '2')
    const dateInput = await screen.findByLabelText(/started at/i)
    await userEvent.type(dateInput, '2025-01-15')
    await userEvent.click(screen.getByRole('button', { name: /^add piece$/i }))

    expect(client.api.pieces.create).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Für Elise', opus: '', number: '', composer_id: 2 })
    )
  })

  it('handles invalid date string in started_at field without crashing', async () => {
    vi.mocked(client.api.pieces.create).mockResolvedValue({ id: 99 } as Piece)
    renderWithRoute('/pieces/new', <PieceForm />, '/pieces/new')

    await userEvent.type(await screen.findByLabelText(/title/i), 'Für Elise')
    await userEvent.selectOptions(screen.getByLabelText(/composer/i), '2')
    const dateInput = await screen.findByLabelText(/started at/i)
    await userEvent.type(dateInput, 'not-a-date')
    await userEvent.click(screen.getByRole('button', { name: /^add piece$/i }))

    expect(client.api.pieces.create).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Für Elise', opus: '', number: '', composer_id: 2 })
    )
  })

  it('submits with status active and a past start date', async () => {
    vi.mocked(client.api.pieces.create).mockResolvedValue({ id: 99 } as Piece)
    renderWithRoute('/pieces/new', <PieceForm />, '/pieces/new')

    await userEvent.type(await screen.findByLabelText(/title/i), 'Moonlight Sonata')
    await userEvent.selectOptions(screen.getByLabelText(/composer/i), '2')
    const dateInput = await screen.findByLabelText(/started at/i)
    await userEvent.type(dateInput, '2024-06-15')
    await userEvent.selectOptions(screen.getByLabelText(/status/i), 'active')
    await userEvent.click(screen.getByRole('button', { name: /^add piece$/i }))

    expect(client.api.pieces.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Moonlight Sonata',
        status: 'active',
      })
    )
    const submitted = vi.mocked(client.api.pieces.create).mock.calls[0][0]
    expect(submitted.started_at).toBeDefined()
  })
})

describe('PieceForm — Edit mode', () => {
  const existingPiece: Piece = {
    id: 7,
    title: 'Moonlight Sonata',
    opus: 'Op. 27 No. 2',
    number: '2',
    composer_id: 2,
    composer: beethoven,
    difficulty: 7,
    status: 'active',
    started_at: '2026-01-01T00:00:00Z',
    last_played_at: null,
    current_level: '',
    notes: '',
  }

  beforeEach(() => {
    clearAuthState()
    setAuthState()
    vi.clearAllMocks()
    vi.mocked(client.api.composers.list).mockResolvedValue([beethoven])
    vi.mocked(client.api.pieces.get).mockResolvedValue(existingPiece)
  })

  it('renders the "Edit Piece" heading', async () => {
    renderWithRoute('/pieces/:id/edit', <PieceForm />, '/pieces/7/edit')
    expect(await screen.findByRole('heading', { name: /edit piece/i })).toBeInTheDocument()
  })

  it('pre-fills the form with the existing piece title', async () => {
    renderWithRoute('/pieces/:id/edit', <PieceForm />, '/pieces/7/edit')
    expect(await screen.findByDisplayValue('Moonlight Sonata')).toBeInTheDocument()
  })

  it('renders a "Save Changes" submit button', async () => {
    renderWithRoute('/pieces/:id/edit', <PieceForm />, '/pieces/7/edit')
    expect(await screen.findByRole('button', { name: /save changes/i })).toBeInTheDocument()
  })

  it('calls api.pieces.update on submission', async () => {
    vi.mocked(client.api.pieces.update).mockResolvedValue(existingPiece)
    renderWithRoute('/pieces/:id/edit', <PieceForm />, '/pieces/7/edit')

    await screen.findByDisplayValue('Moonlight Sonata')
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }))

    expect(client.api.pieces.update).toHaveBeenCalledWith(7, expect.any(Object))
  })
})

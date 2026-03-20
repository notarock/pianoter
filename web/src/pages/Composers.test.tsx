import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Composers from './Composers'
import { renderWithProviders, setAuthState, clearAuthState } from '../test-utils'
import * as client from '../api/client'
import type { Composer } from '../api/types'

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
    composers: { list: vi.fn(), create: vi.fn(), delete: vi.fn() },
  },
}))

const systemComposer: Composer = { id: 1, user_id: 0, name: 'Johann Sebastian Bach', nationality: 'German', born_year: 1685, died_year: 1750 }
const userComposer: Composer = { id: 99, user_id: 1, name: 'My Composer', nationality: 'French', born_year: 1900, died_year: null }

describe('Composers page', () => {
  beforeEach(() => {
    clearAuthState()
    setAuthState()
    vi.clearAllMocks()
    vi.mocked(client.api.composers.list).mockResolvedValue([systemComposer, userComposer])
  })

  it('renders the Composers heading', async () => {
    renderWithProviders(<Composers />)
    expect(await screen.findByRole('heading', { name: /composers/i })).toBeInTheDocument()
  })

  it('renders the Add Composer button', async () => {
    renderWithProviders(<Composers />)
    expect(await screen.findByRole('button', { name: /add composer/i })).toBeInTheDocument()
  })

  it('renders the "Hide system composers" checkbox', async () => {
    renderWithProviders(<Composers />)
    expect(await screen.findByRole('checkbox', { name: /hide system composers/i })).toBeInTheDocument()
  })

  it('renders table column headers: Name, Nationality, Born, Died', async () => {
    renderWithProviders(<Composers />)
    expect(await screen.findByRole('columnheader', { name: /name/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /nationality/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /born/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /died/i })).toBeInTheDocument()
  })

  it('renders system composer with a "system" badge', async () => {
    renderWithProviders(<Composers />)
    expect(await screen.findByText('Johann Sebastian Bach')).toBeInTheDocument()
    expect(screen.getByText('system')).toBeInTheDocument()
  })

  it('renders user-created composer without "system" badge', async () => {
    renderWithProviders(<Composers />)
    expect(await screen.findByText('My Composer')).toBeInTheDocument()
  })

  it('renders a Delete button for user-created composers only', async () => {
    renderWithProviders(<Composers />)
    await screen.findByText('My Composer')
    // Only one delete button — for the user composer, not the system one
    const deleteBtns = screen.getAllByRole('button', { name: /delete/i })
    expect(deleteBtns).toHaveLength(1)
  })

  it('hides system composers when the checkbox is checked', async () => {
    renderWithProviders(<Composers />)
    const checkbox = await screen.findByRole('checkbox', { name: /hide system composers/i })
    await userEvent.click(checkbox)
    expect(screen.queryByText('Johann Sebastian Bach')).not.toBeInTheDocument()
    expect(screen.getByText('My Composer')).toBeInTheDocument()
  })

  it('toggles the Add Composer form when button is clicked', async () => {
    renderWithProviders(<Composers />)
    const addBtn = await screen.findByRole('button', { name: /add composer/i })
    await userEvent.click(addBtn)
    expect(screen.getByPlaceholderText(/name/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('calls api.composers.create when the inline form is submitted', async () => {
    vi.mocked(client.api.composers.create).mockResolvedValue({ ...userComposer, id: 100, name: 'New Composer' })
    renderWithProviders(<Composers />)

    await userEvent.click(await screen.findByRole('button', { name: /add composer/i }))
    await userEvent.type(screen.getByPlaceholderText(/name/i), 'New Composer')
    await userEvent.click(screen.getByRole('button', { name: /^add$/i }))

    expect(client.api.composers.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'New Composer' })
    )
  })
})

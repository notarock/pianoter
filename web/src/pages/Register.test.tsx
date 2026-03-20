import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Register from './Register'
import { renderWithProviders, clearAuthState } from '../test-utils'
import * as client from '../api/client'

vi.mock('../api/client', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
  },
  api: {},
}))

/** Same as Login — labels are siblings, not wrappers, so no htmlFor association. */
function getUsernameInput() {
  return screen.getByRole('textbox')
}
function getPasswordInputs() {
  return document.querySelectorAll('input[type="password"]')
}

describe('Register page', () => {
  beforeEach(() => {
    clearAuthState()
    vi.clearAllMocks()
  })

  it('renders the create account heading', () => {
    renderWithProviders(<Register />)
    expect(screen.getByRole('heading', { name: /create an account/i })).toBeInTheDocument()
  })

  it('renders a username input', () => {
    renderWithProviders(<Register />)
    expect(getUsernameInput()).toBeInTheDocument()
  })

  it('renders password and confirm password inputs', () => {
    renderWithProviders(<Register />)
    const pwInputs = getPasswordInputs()
    expect(pwInputs).toHaveLength(2)
  })

  it('renders labels for all three fields', () => {
    renderWithProviders(<Register />)
    expect(screen.getByText(/^username$/i)).toBeInTheDocument()
    expect(screen.getByText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByText(/confirm password/i)).toBeInTheDocument()
  })

  it('renders a Register submit button', () => {
    renderWithProviders(<Register />)
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument()
  })

  it('renders a link back to the login page', () => {
    renderWithProviders(<Register />)
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login')
  })

  it('shows an error when passwords do not match', async () => {
    renderWithProviders(<Register />)
    const [pw, confirm] = getPasswordInputs()

    await userEvent.type(getUsernameInput(), 'alice')
    await userEvent.type(pw, 'secret')
    await userEvent.type(confirm, 'different')
    await userEvent.click(screen.getByRole('button', { name: /register/i }))

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument()
    expect(client.authApi.register).not.toHaveBeenCalled()
  })

  it('shows an error when registration fails', async () => {
    vi.mocked(client.authApi.register).mockRejectedValueOnce(new Error('409'))
    renderWithProviders(<Register />)
    const [pw, confirm] = getPasswordInputs()

    await userEvent.type(getUsernameInput(), 'alice')
    await userEvent.type(pw, 'secret')
    await userEvent.type(confirm, 'secret')
    await userEvent.click(screen.getByRole('button', { name: /register/i }))

    expect(await screen.findByText(/registration failed/i)).toBeInTheDocument()
  })

  it('calls authApi.register with entered credentials', async () => {
    vi.mocked(client.authApi.register).mockResolvedValueOnce({ token: 'tok', user: { id: 1, username: 'alice' } })
    renderWithProviders(<Register />)
    const [pw, confirm] = getPasswordInputs()

    await userEvent.type(getUsernameInput(), 'alice')
    await userEvent.type(pw, 'secret')
    await userEvent.type(confirm, 'secret')
    await userEvent.click(screen.getByRole('button', { name: /register/i }))

    expect(client.authApi.register).toHaveBeenCalledWith('alice', 'secret')
  })
})

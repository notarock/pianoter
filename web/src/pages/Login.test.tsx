import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Login from './Login'
import { renderWithProviders, clearAuthState } from '../test-utils'
import * as client from '../api/client'

vi.mock('../api/client', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
  },
  api: {},
}))

/** The current Login form uses sibling <label> + <input> without htmlFor,
 *  so we query inputs by role/type rather than by label text. */
function getUsernameInput() {
  return screen.getByRole('textbox')
}
function getPasswordInput() {
  return document.querySelector('input[type="password"]') as HTMLInputElement
}

describe('Login page', () => {
  beforeEach(() => {
    clearAuthState()
    vi.clearAllMocks()
  })

  it('renders the sign-in heading', () => {
    renderWithProviders(<Login />)
    expect(screen.getByRole('heading', { name: /sign in to pianoter/i })).toBeInTheDocument()
  })

  it('renders a username text input', () => {
    renderWithProviders(<Login />)
    expect(getUsernameInput()).toBeInTheDocument()
  })

  it('renders a password input', () => {
    renderWithProviders(<Login />)
    expect(getPasswordInput()).toBeInTheDocument()
  })

  it('renders labels for username and password', () => {
    renderWithProviders(<Login />)
    expect(screen.getByText(/^username$/i)).toBeInTheDocument()
    expect(screen.getByText(/^password$/i)).toBeInTheDocument()
  })

  it('renders a Sign in submit button', () => {
    renderWithProviders(<Login />)
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('renders a link to the register page', () => {
    renderWithProviders(<Login />)
    expect(screen.getByRole('link', { name: /register/i })).toHaveAttribute('href', '/register')
  })

  it('shows an error message on failed login', async () => {
    vi.mocked(client.authApi.login).mockRejectedValueOnce(new Error('401'))
    renderWithProviders(<Login />)

    await userEvent.type(getUsernameInput(), 'baduser')
    await userEvent.type(getPasswordInput(), 'badpass')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText(/invalid username or password/i)).toBeInTheDocument()
  })

  it('calls authApi.login with entered credentials', async () => {
    vi.mocked(client.authApi.login).mockResolvedValueOnce({ token: 'tok', user: { id: 1, username: 'alice' } })
    renderWithProviders(<Login />)

    await userEvent.type(getUsernameInput(), 'alice')
    await userEvent.type(getPasswordInput(), 'secret')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(client.authApi.login).toHaveBeenCalledWith('alice', 'secret')
  })
})

import { render, screen, cleanup } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { afterEach, beforeEach, expect, it } from 'vitest'
import App from './App'
import { clearAuthState, setAuthState } from './test-utils'
import i18n from './i18n'
import userEvent from '@testing-library/user-event'

beforeEach(() => {
  clearAuthState()
  window.history.replaceState({}, '', '/')
  i18n.changeLanguage('en')
})

afterEach(cleanup)

function renderApp() {
  render(<MantineProvider><App /></MantineProvider>)
}

it('keeps the home page public and links to registration', () => {
  renderApp()
  expect(window.location.pathname).toBe('/')
  expect(screen.getByText(/Pianoter is a piano practice tracker/)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute('href', '/register')
})

it('protects the dashboard', () => {
  window.history.replaceState({}, '', '/dashboard')
  renderApp()
  expect(screen.getByRole('heading', { name: 'Sign in to Pianoter' })).toBeInTheDocument()
  expect(window.location.pathname).toBe('/login')
})

it('offers the dashboard on the public home page when signed in', () => {
  setAuthState()
  renderApp()
  expect(screen.getByRole('link', { name: 'Open dashboard' })).toHaveAttribute('href', '/dashboard')
  expect(screen.queryByRole('link', { name: 'Create an account' })).not.toBeInTheDocument()
  expect(window.location.pathname).toBe('/')
})

it('lets visitors search and filter the example repertoire locally', async () => {
  renderApp()
  const search = screen.getByPlaceholderText('Search by title…')
  await userEvent.type(search, 'Clair')
  expect(screen.getByRole('button', { name: /Claude Debussy/ })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /Frédéric Chopin/ })).not.toBeInTheDocument()
  await userEvent.clear(search)
  await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Status' }), 'learning')
  expect(screen.getByRole('button', { name: /Frédéric Chopin/ })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /Claude Debussy/ })).not.toBeInTheDocument()
  await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Composer' }), '2')
  expect(screen.queryByRole('button', { name: /Frédéric Chopin/ })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /Erik Satie/ })).not.toBeInTheDocument()
})

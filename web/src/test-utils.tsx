import { render, type RenderOptions } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { MantineProvider } from '@mantine/core'
import { AuthProvider } from './context/AuthContext'
import { theme } from './theme'

function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider theme={theme}>
      {children}
    </MantineProvider>
  )
}

/** Renders inside MantineProvider + MemoryRouter + AuthProvider (no route params). */
export function renderWithProviders(
  ui: React.ReactElement,
  options: RenderOptions = {},
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AllProviders>
        <MemoryRouter>
          <AuthProvider>{children}</AuthProvider>
        </MemoryRouter>
      </AllProviders>
    )
  }
  return render(ui, { wrapper: Wrapper, ...options })
}

/**
 * Renders inside a real Routes/Route context so useParams works.
 * Use this for any component that calls useParams() or useNavigate().
 */
export function renderWithRoute(
  routePath: string,
  component: React.ReactElement,
  initialEntry: string,
  options: RenderOptions = {},
) {
  return render(
    <AllProviders>
      <MemoryRouter initialEntries={[initialEntry]}>
        <AuthProvider>
          <Routes>
            <Route path={routePath} element={component} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </AllProviders>,
    options,
  )
}

/** Seed localStorage so components see an authenticated user. */
export function setAuthState(username = 'testuser') {
  localStorage.setItem('token', 'test-token')
  localStorage.setItem('user', JSON.stringify({ id: 1, username }))
}

export function clearAuthState() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

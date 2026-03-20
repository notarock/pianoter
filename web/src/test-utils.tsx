import { render, type RenderOptions } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'

/** Renders inside MemoryRouter + AuthProvider (no route params). */
export function renderWithProviders(
  ui: React.ReactElement,
  options: RenderOptions = {},
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MemoryRouter>
        <AuthProvider>{children}</AuthProvider>
      </MemoryRouter>
    )
  }
  return render(ui, { wrapper: Wrapper, ...options })
}

/**
 * Renders inside a real Routes/Route context so useParams works.
 * Use this for any component that calls useParams() or useNavigate().
 *
 * @param routePath  The route pattern, e.g. "/pieces/:id"
 * @param component  The component to render
 * @param initialEntry  The URL to start at, e.g. "/pieces/7"
 */
export function renderWithRoute(
  routePath: string,
  component: React.ReactElement,
  initialEntry: string,
  options: RenderOptions = {},
) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthProvider>
        <Routes>
          <Route path={routePath} element={component} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
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

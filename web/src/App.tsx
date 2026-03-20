import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { AppShell, Group, Text, Button, Anchor, Box } from '@mantine/core'
import Dashboard from './pages/Dashboard'
import Repertoire from './pages/Repertoire'
import PieceDetail from './pages/PieceDetail'
import PieceForm from './pages/PieceForm'
import Composers from './pages/Composers'
import ComposerDetail from './pages/ComposerDetail'
import Login from './pages/Login'
import Register from './pages/Register'
import { AuthProvider, useAuth } from './context/AuthContext'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

function Nav() {
  const { user, token, logout } = useAuth()

  return (
    <AppShell.Header
      style={{
        background: '#fff',
        borderBottom: '1px solid var(--app-border)',
      }}
    >
      <Group h="100%" px="xl" justify="space-between">
        {/* Brand */}
        <Group gap="xs">
          <Text span style={{ fontSize: '1.4rem', lineHeight: 1 }}>🎹</Text>
          <Text
            fw={700}
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '1.15rem',
              color: '#1A1612',
              letterSpacing: '-0.01em',
            }}
          >
            Pianoter
          </Text>
        </Group>

        {/* Nav links */}
        {token && (
          <Group gap="xl">
            {[
              { to: '/', label: 'Dashboard', end: true },
              { to: '/repertoire', label: 'Repertoire' },
              { to: '/composers', label: 'Composers' },
            ].map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={end}>
                {({ isActive }) => (
                  <Text
                    component="span"
                    fw={isActive ? 600 : 400}
                    style={{
                      color: isActive ? 'var(--mantine-color-terracotta-8)' : '#6B6560',
                      borderBottom: isActive
                        ? '2px solid var(--mantine-color-terracotta-8)'
                        : '2px solid transparent',
                      paddingBottom: 2,
                      fontSize: '0.9375rem',
                      textDecoration: 'none',
                      transition: 'color 150ms ease',
                    }}
                  >
                    {label}
                  </Text>
                )}
              </NavLink>
            ))}
          </Group>
        )}

        {/* User + logout */}
        {user && (
          <Group gap="md">
            <Text size="sm" c="dimmed">{user.username}</Text>
            <Anchor
              component="button"
              onClick={logout}
              size="sm"
              c="dimmed"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Logout
            </Anchor>
          </Group>
        )}
      </Group>
    </AppShell.Header>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell header={{ height: 56 }} bg="var(--app-bg)">
          <Nav />
          <AppShell.Main>
            <Box maw={960} mx="auto" px="xl" py="xl">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/repertoire" element={<ProtectedRoute><Repertoire /></ProtectedRoute>} />
                <Route path="/pieces/new" element={<ProtectedRoute><PieceForm /></ProtectedRoute>} />
                <Route path="/pieces/:id" element={<ProtectedRoute><PieceDetail /></ProtectedRoute>} />
                <Route path="/pieces/:id/edit" element={<ProtectedRoute><PieceForm /></ProtectedRoute>} />
                <Route path="/composers" element={<ProtectedRoute><Composers /></ProtectedRoute>} />
                <Route path="/composers/:id" element={<ProtectedRoute><ComposerDetail /></ProtectedRoute>} />
              </Routes>
            </Box>
          </AppShell.Main>
        </AppShell>
      </AuthProvider>
    </BrowserRouter>
  )
}

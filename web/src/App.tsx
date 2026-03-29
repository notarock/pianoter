import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { AppShell, Group, Text, Anchor, Box, SegmentedControl, Stack } from '@mantine/core'
import { useTranslation } from 'react-i18next'
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
  const { t, i18n } = useTranslation()

  return (
    <AppShell.Header
      style={{
        background: 'var(--app-bg-surface)',
        borderBottom: '1px solid var(--app-border)',
      }}
    >
      <nav style={{ height: '100%' }}>
      <Stack gap={0} h="100%" justify="center">
        {/* Top row: brand + controls */}
        <Group px="xl" justify="space-between" wrap="nowrap" h={56}>
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

          {/* Desktop nav links (hidden on mobile) */}
          {token && (
            <Group gap="xl" visibleFrom="sm">
              {[
                { to: '/', label: t('nav.dashboard'), end: true },
                { to: '/repertoire', label: t('nav.repertoire') },
                { to: '/composers', label: t('nav.composers') },
              ].map(({ to, label, end }) => (
                <NavLink key={to} to={to} end={end} style={{ textDecoration: 'none' }}>
                  {({ isActive }) => (
                    <Text
                      component="span"
                      fw={isActive ? 600 : 400}
                      style={{
                        color: isActive ? 'var(--mantine-color-gray-9)' : '#6B6560',
                        borderBottom: isActive
                          ? '2px solid var(--mantine-color-gray-9)'
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

          {/* Language switcher + user + logout */}
          <Group gap="md" wrap="nowrap">
            <SegmentedControl
              size="xs"
              value={i18n.resolvedLanguage === 'fr' ? 'fr' : 'en'}
              onChange={lang => i18n.changeLanguage(lang)}
              data={[
                { label: 'EN', value: 'en' },
                { label: 'FR', value: 'fr' },
              ]}
            />
            {user && (
              <>
                <Text size="sm" c="dimmed" visibleFrom="sm">{user.username}</Text>
                <Anchor
                  component="button"
                  onClick={logout}
                  size="sm"
                  c="dimmed"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  {t('nav.logout')}
                </Anchor>
              </>
            )}
          </Group>
        </Group>

        {/* Mobile nav links (hidden on desktop) */}
        {token && (
          <Group
            hiddenFrom="sm"
            gap={0}
            px="xl"
            h={40}
            style={{ borderTop: '1px solid var(--app-border)' }}
          >
            {[
              { to: '/', label: t('nav.dashboard'), end: true },
              { to: '/repertoire', label: t('nav.repertoire') },
              { to: '/composers', label: t('nav.composers') },
            ].map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={end} style={{ textDecoration: 'none' }}>
                {({ isActive }) => (
                  <Text
                    component="span"
                    fw={isActive ? 600 : 400}
                    px="md"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      height: 40,
                      color: isActive ? 'var(--mantine-color-gray-9)' : '#6B6560',
                      borderBottom: isActive
                        ? '2px solid var(--mantine-color-gray-9)'
                        : '2px solid transparent',
                      fontSize: '0.875rem',
                      textDecoration: 'none',
                    }}
                  >
                    {label}
                  </Text>
                )}
              </NavLink>
            ))}
          </Group>
        )}
      </Stack>
      </nav>
    </AppShell.Header>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell header={{ height: { base: 96, sm: 56 } }} bg="var(--app-bg)">
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

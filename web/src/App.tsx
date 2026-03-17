import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Repertoire from './pages/Repertoire'
import PieceDetail from './pages/PieceDetail'
import PieceForm from './pages/PieceForm'
import Composers from './pages/Composers'
import Login from './pages/Login'
import Register from './pages/Register'
import { AuthProvider, useAuth } from './context/AuthContext'
import './App.css'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

function Nav() {
  const { user, token, logout } = useAuth()
  const style = ({ isActive }: { isActive: boolean }) => ({
    fontWeight: isActive ? '600' : 'normal',
    textDecoration: 'none',
    color: isActive ? '#3182ce' : '#555',
    borderBottom: isActive ? '2px solid #3182ce' : '2px solid transparent',
    paddingBottom: '2px',
  })
  return (
    <nav style={{ display: 'flex', gap: '1.5rem', padding: '1rem 2rem', borderBottom: '1px solid #e2e8f0', background: '#fff', alignItems: 'center' }}>
      <span style={{ fontWeight: 'bold', fontSize: '1.1rem', marginRight: '1rem' }}>🎹 Pianoter</span>
      {token && (
        <>
          <NavLink to="/" end style={style}>Dashboard</NavLink>
          <NavLink to="/repertoire" style={style}>Repertoire</NavLink>
          <NavLink to="/composers" style={style}>Composers</NavLink>
        </>
      )}
      {user && (
        <span style={{ marginLeft: 'auto', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ color: '#666', fontSize: '0.9rem' }}>{user.username}</span>
          <button onClick={logout} style={{ cursor: 'pointer', background: 'none', border: 'none', color: '#888', fontSize: '0.9rem', padding: 0 }}>Logout</button>
        </span>
      )}
    </nav>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Nav />
        <main style={{ padding: '2rem', maxWidth: 960, margin: '0 auto' }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/repertoire" element={<ProtectedRoute><Repertoire /></ProtectedRoute>} />
            <Route path="/pieces/new" element={<ProtectedRoute><PieceForm /></ProtectedRoute>} />
            <Route path="/pieces/:id" element={<ProtectedRoute><PieceDetail /></ProtectedRoute>} />
            <Route path="/pieces/:id/edit" element={<ProtectedRoute><PieceForm /></ProtectedRoute>} />
            <Route path="/composers" element={<ProtectedRoute><Composers /></ProtectedRoute>} />
          </Routes>
        </main>
      </AuthProvider>
    </BrowserRouter>
  )
}

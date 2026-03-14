import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Repertoire from './pages/Repertoire'
import PieceDetail from './pages/PieceDetail'
import PieceForm from './pages/PieceForm'
import Composers from './pages/Composers'
import './App.css'

function Nav() {
  const style = ({ isActive }: { isActive: boolean }) => ({
    fontWeight: isActive ? 'bold' : 'normal',
    textDecoration: 'none',
    color: isActive ? '#3182ce' : '#333',
  })
  return (
    <nav style={{ display: 'flex', gap: '1.5rem', padding: '1rem 2rem', borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
      <span style={{ fontWeight: 'bold', fontSize: '1.1rem', marginRight: '1rem' }}>🎹 Pianoter</span>
      <NavLink to="/" end style={style}>Dashboard</NavLink>
      <NavLink to="/repertoire" style={style}>Repertoire</NavLink>
      <NavLink to="/composers" style={style}>Composers</NavLink>
    </nav>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <main style={{ padding: '2rem', maxWidth: 960, margin: '0 auto' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/repertoire" element={<Repertoire />} />
          <Route path="/pieces/new" element={<PieceForm />} />
          <Route path="/pieces/:id" element={<PieceDetail />} />
          <Route path="/pieces/:id/edit" element={<PieceForm />} />
          <Route path="/composers" element={<Composers />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}

import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const res = await authApi.login(username, password)
      login(res.token, res.user)
      navigate('/')
    } catch {
      setError('Invalid username or password')
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: '6rem auto', padding: '2rem', border: '1px solid #e2e8f0', borderRadius: 8 }}>
      <h2 style={{ marginBottom: '1.5rem' }}>Sign in to Pianoter</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: 4 }}>Username</label>
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            autoFocus
            style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 4 }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
          />
        </div>
        {error && <p style={{ color: 'red', margin: 0 }}>{error}</p>}
        <button type="submit" style={{ padding: '0.6rem', cursor: 'pointer', background: '#3182ce', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: '1rem' }}>Sign in</button>
      </form>
      <p style={{ marginTop: '1rem', textAlign: 'center' }}>
        No account? <Link to="/register">Register</Link>
      </p>
    </div>
  )
}

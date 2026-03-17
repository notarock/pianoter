import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { Piece } from '../api/types'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()
  const [stale, setStale] = useState<Piece[]>([])
  const [all, setAll] = useState<Piece[]>([])

  useEffect(() => {
    api.pieces.list({ stale_days: 30 }).then(setStale)
    api.pieces.list().then(setAll)
  }, [])

  const byStatus = (s: string) => all.filter(p => p.status === s).length

  return (
    <div>
      <h1>Welcome back, {user?.username} 👋</h1>

      <div style={{ display: 'flex', gap: '1rem', margin: '1rem 0' }}>
        {([
          { status: 'wishlist', bg: '#ebf8ff', color: '#2b6cb0', accent: '#3182ce' },
          { status: 'learning', bg: '#fffbeb', color: '#92400e', accent: '#d97706' },
          { status: 'active',   bg: '#f0fff4', color: '#276749', accent: '#38a169' },
          { status: 'shelved',  bg: '#f7fafc', color: '#4a5568', accent: '#718096' },
        ] as const).map(({ status, bg, color, accent }) => (
          <div key={status} style={{ padding: '1rem', background: bg, borderRadius: 8, minWidth: 100, textAlign: 'center', borderTop: `3px solid ${accent}` }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: accent }}>{byStatus(status)}</div>
            <div style={{ textTransform: 'capitalize', color }}>{status}</div>
          </div>
        ))}
      </div>

      {all.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', border: '1px dashed #cbd5e0', borderRadius: 12, margin: '1.5rem 0', color: '#888' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎼</div>
          <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.4rem', color: '#333' }}>Your repertoire is empty</div>
          <div style={{ marginBottom: '1.25rem' }}>Add pieces to start tracking your practice.</div>
          <Link to="/repertoire">
            <button style={{ background: '#3182ce', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, padding: '0.5rem 1.2rem', cursor: 'pointer' }}>Go to Repertoire</button>
          </Link>
        </div>
      )}

      <h2>To Revisit (not played in 30+ days)</h2>
      {stale.length === 0 ? (
        <p style={{ color: '#888' }}>All caught up! No pieces overdue for practice.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Title</th>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Composer</th>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Last Played</th>
              <th style={{ textAlign: 'left', padding: '0.5rem' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {stale.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '0.5rem' }}>
                  <Link to={`/pieces/${p.id}`}>{p.title}</Link>
                </td>
                <td style={{ padding: '0.5rem' }}>{p.composer?.name ?? '—'}</td>
                <td style={{ padding: '0.5rem' }}>
                  {p.last_played_at ? new Date(p.last_played_at).toLocaleDateString() : 'Never'}
                </td>
                <td style={{ padding: '0.5rem', textTransform: 'capitalize' }}>{p.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

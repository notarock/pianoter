import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { Piece } from '../api/types'

export default function Dashboard() {
  const [stale, setStale] = useState<Piece[]>([])
  const [all, setAll] = useState<Piece[]>([])

  useEffect(() => {
    api.pieces.list({ stale_days: 30 }).then(setStale)
    api.pieces.list().then(setAll)
  }, [])

  const byStatus = (s: string) => all.filter(p => p.status === s).length

  return (
    <div>
      <h1>Dashboard</h1>

      <div style={{ display: 'flex', gap: '1rem', margin: '1rem 0' }}>
        {(['wishlist', 'learning', 'active', 'shelved'] as const).map(s => (
          <div key={s} style={{ padding: '1rem', background: '#f5f5f5', borderRadius: 8, minWidth: 100, textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{byStatus(s)}</div>
            <div style={{ textTransform: 'capitalize', color: '#666' }}>{s}</div>
          </div>
        ))}
      </div>

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

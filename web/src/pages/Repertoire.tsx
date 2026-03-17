import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import type { Piece, Composer } from '../api/types'

export default function Repertoire() {
  const [pieces, setPieces] = useState<Piece[]>([])
  const [composers, setComposers] = useState<Composer[]>([])
  const [status, setStatus] = useState('')
  const [composerId, setComposerId] = useState('')

  const load = () => {
    api.pieces
      .list({
        status: status || undefined,
        composer_id: composerId ? Number(composerId) : undefined,
      })
      .then(setPieces)
  }

  useEffect(() => {
    api.composers.list().then(setComposers)
  }, [])

  useEffect(() => {
    load()
  }, [status, composerId])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Repertoire</h1>
        <Link to="/pieces/new">
          <button style={{ background: '#3182ce', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, padding: '0.4rem 0.9rem', cursor: 'pointer' }}>+ Add Piece</button>
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '1rem', margin: '1rem 0' }}>
        <select value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="wishlist">Wishlist</option>
          <option value="learning">Learning</option>
          <option value="active">Active</option>
          <option value="shelved">Shelved</option>
        </select>
        <select value={composerId} onChange={e => setComposerId(e.target.value)}>
          <option value="">All composers</option>
          {composers.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Title</th>
            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Composer</th>
            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Difficulty</th>
            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Status</th>
            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Last Played</th>
          </tr>
        </thead>
        <tbody>
          {pieces.map(p => (
            <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.5rem' }}>
                <Link to={`/pieces/${p.id}`}>{p.title}</Link>
              </td>
              <td style={{ padding: '0.5rem' }}>{p.composer?.name ?? '—'}</td>
              <td style={{ padding: '0.5rem' }}>{p.difficulty}/10</td>
              <td style={{ padding: '0.5rem', textTransform: 'capitalize' }}>{p.status}</td>
              <td style={{ padding: '0.5rem' }}>
                {p.last_played_at ? new Date(p.last_played_at).toLocaleDateString() : 'Never'}
              </td>
            </tr>
          ))}
          {pieces.length === 0 && (
            <tr>
              <td colSpan={5}>
                {!status && !composerId ? (
                  <div style={{ padding: '3rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎹</div>
                    <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.4rem', color: '#333' }}>No pieces yet</div>
                    <div style={{ color: '#888', marginBottom: '1.25rem' }}>Start building your repertoire by adding your first piece.</div>
                    <Link to="/pieces/new">
                      <button style={{ background: '#3182ce', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, padding: '0.5rem 1.2rem', cursor: 'pointer' }}>+ Add your first piece</button>
                    </Link>
                  </div>
                ) : (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
                    No pieces match your filters.
                  </div>
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

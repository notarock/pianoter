import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../api/client'
import type { Piece, PlaySession } from '../api/types'

export default function PieceDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [piece, setPiece] = useState<Piece | null>(null)
  const [sessions, setSessions] = useState<PlaySession[]>([])
  const [notes, setNotes] = useState('')
  const [logging, setLogging] = useState(false)

  const load = () => {
    const numId = Number(id)
    api.pieces.get(numId).then(setPiece)
    api.sessions.list(numId).then(setSessions)
  }

  useEffect(() => { load() }, [id])

  const logSession = async () => {
    await api.sessions.create(Number(id), { notes })
    setNotes('')
    setLogging(false)
    load()
  }

  const deletePiece = async () => {
    if (!confirm('Delete this piece?')) return
    await api.pieces.delete(Number(id))
    navigate('/repertoire')
  }

  if (!piece) return <p>Loading...</p>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>{piece.title}</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to={`/pieces/${id}/edit`}><button>Edit</button></Link>
          <button onClick={deletePiece} style={{ background: '#e53e3e', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: 4, cursor: 'pointer' }}>Delete</button>
        </div>
      </div>

      <table style={{ borderCollapse: 'collapse', marginBottom: '1rem' }}>
        <tbody>
          <tr><td style={{ padding: '0.25rem 1rem 0.25rem 0', color: '#666' }}>Composer</td><td>{piece.composer?.name ?? '—'}</td></tr>
          <tr><td style={{ padding: '0.25rem 1rem 0.25rem 0', color: '#666' }}>Difficulty</td><td>{piece.difficulty}/10</td></tr>
          <tr><td style={{ padding: '0.25rem 1rem 0.25rem 0', color: '#666' }}>Status</td><td style={{ textTransform: 'capitalize' }}>{piece.status}</td></tr>
          <tr><td style={{ padding: '0.25rem 1rem 0.25rem 0', color: '#666' }}>Started</td><td>{piece.started_at ? new Date(piece.started_at).toLocaleDateString() : '—'}</td></tr>
          <tr><td style={{ padding: '0.25rem 1rem 0.25rem 0', color: '#666' }}>Last Played</td><td>{piece.last_played_at ? new Date(piece.last_played_at).toLocaleDateString() : 'Never'}</td></tr>
        </tbody>
      </table>

      <div style={{ marginBottom: '1rem' }}>
        <button onClick={() => setLogging(v => !v)}>
          {logging ? 'Cancel' : '+ Log Practice Session'}
        </button>
        {logging && (
          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
            <input
              style={{ flex: 1, padding: '0.5rem', border: '1px solid #ccc', borderRadius: 4 }}
              placeholder="Notes (optional)"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
            <button onClick={logSession}>Save</button>
          </div>
        )}
      </div>

      <h2>Practice History</h2>
      {sessions.length === 0 ? (
        <p style={{ color: '#888' }}>No sessions logged yet.</p>
      ) : (
        <div style={{ borderLeft: '2px solid #e2e8f0', paddingLeft: '1rem' }}>
          {sessions.map(s => (
            <div key={s.id} style={{ marginBottom: '1rem' }}>
              <div style={{ fontWeight: 'bold' }}>{new Date(s.played_at).toLocaleString()}</div>
              {s.notes && <div style={{ color: '#666' }}>{s.notes}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

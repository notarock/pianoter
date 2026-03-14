import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../api/client'
import { PLAYING_LEVELS } from '../api/types'
import type { Piece, PlaySession, PlayingLevel } from '../api/types'

function levelLabel(key: PlayingLevel | ''): string {
  if (!key) return '—'
  return PLAYING_LEVELS.find(l => l.key === key)?.label ?? key
}

function levelDescription(key: PlayingLevel | ''): string {
  if (!key) return ''
  return PLAYING_LEVELS.find(l => l.key === key)?.description ?? ''
}

export default function PieceDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [piece, setPiece] = useState<Piece | null>(null)
  const [sessions, setSessions] = useState<PlaySession[]>([])
  const [notes, setNotes] = useState('')
  const [playingLevel, setPlayingLevel] = useState<PlayingLevel | ''>('')
  const [logging, setLogging] = useState(false)

  const load = () => {
    const numId = Number(id)
    api.pieces.get(numId).then(setPiece)
    api.sessions.list(numId).then(setSessions)
  }

  useEffect(() => { load() }, [id])

  const logSession = async () => {
    const data: { notes?: string; playing_level?: PlayingLevel } = { notes }
    if (playingLevel) data.playing_level = playingLevel
    await api.sessions.create(Number(id), data)
    setNotes('')
    setPlayingLevel('')
    setLogging(false)
    load()
  }

  const deletePiece = async () => {
    if (!confirm('Delete this piece?')) return
    await api.pieces.delete(Number(id))
    navigate('/repertoire')
  }

  if (!piece) return <p>Loading...</p>

  // Sessions ordered oldest→newest for progression analysis
  const chronological = [...sessions].reverse()

  // Progression summary: collect first date seen for each level and days spent
  const levelChanges: { level: PlayingLevel; date: string }[] = []
  for (const s of chronological) {
    if (s.playing_level && (levelChanges.length === 0 || levelChanges[levelChanges.length - 1].level !== s.playing_level)) {
      levelChanges.push({ level: s.playing_level as PlayingLevel, date: s.played_at })
    }
  }

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
          <tr><td style={{ padding: '0.25rem 1rem 0.25rem 0', color: '#666' }}>Current Level</td><td>{levelLabel(piece.current_level)}</td></tr>
        </tbody>
      </table>

      <div style={{ marginBottom: '1rem' }}>
        <button onClick={() => setLogging(v => !v)}>
          {logging ? 'Cancel' : '+ Log Practice Session'}
        </button>
        {logging && (
          <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                style={{ flex: 1, padding: '0.5rem', border: '1px solid #ccc', borderRadius: 4 }}
                placeholder="Notes (optional)"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
              <button onClick={logSession}>Save</button>
            </div>
            <div>
              <select
                value={playingLevel}
                onChange={e => setPlayingLevel(e.target.value as PlayingLevel | '')}
                style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: 4 }}
              >
                <option value="">— No level recorded —</option>
                {PLAYING_LEVELS.map(l => (
                  <option key={l.key} value={l.key} title={l.description}>{l.label}</option>
                ))}
              </select>
              {playingLevel && (
                <div style={{ marginTop: '0.25rem', fontSize: '0.85rem', color: '#666' }}>
                  {levelDescription(playingLevel)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {levelChanges.length > 1 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h2>Level Progression</h2>
          <table style={{ borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr>
                <th style={{ padding: '0.25rem 1rem 0.25rem 0', textAlign: 'left', color: '#666' }}>Level</th>
                <th style={{ padding: '0.25rem 1rem 0.25rem 0', textAlign: 'left', color: '#666' }}>Reached</th>
                <th style={{ padding: '0.25rem 1rem 0.25rem 0', textAlign: 'left', color: '#666' }}>Days spent</th>
              </tr>
            </thead>
            <tbody>
              {levelChanges.map((lc, i) => {
                const start = new Date(lc.date)
                const end = i + 1 < levelChanges.length ? new Date(levelChanges[i + 1].date) : new Date()
                const days = Math.round((end.getTime() - start.getTime()) / 86400000)
                return (
                  <tr key={lc.level}>
                    <td style={{ padding: '0.25rem 1rem 0.25rem 0' }}>{levelLabel(lc.level)}</td>
                    <td style={{ padding: '0.25rem 1rem 0.25rem 0' }}>{start.toLocaleDateString()}</td>
                    <td style={{ padding: '0.25rem 1rem 0.25rem 0' }}>{i + 1 < levelChanges.length ? `${days}d` : `${days}d (ongoing)`}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <h2>Practice History</h2>
      {sessions.length === 0 ? (
        <p style={{ color: '#888' }}>No sessions logged yet.</p>
      ) : (
        <div style={{ borderLeft: '2px solid #e2e8f0', paddingLeft: '1rem' }}>
          {sessions.map((s, i) => {
            const prevLevel = sessions[i + 1]?.playing_level ?? ''
            const levelChanged = s.playing_level && s.playing_level !== prevLevel
            return (
              <div key={s.id} style={{ marginBottom: '1rem' }}>
                <div style={{ fontWeight: 'bold' }}>{new Date(s.played_at).toLocaleString()}</div>
                {s.playing_level && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                    <span style={{
                      fontSize: '0.8rem',
                      padding: '0.1rem 0.5rem',
                      borderRadius: 12,
                      background: '#ebf8ff',
                      color: '#2b6cb0',
                      border: '1px solid #bee3f8',
                    }}>
                      {levelLabel(s.playing_level as PlayingLevel)}
                    </span>
                    {levelChanged && (
                      <span style={{ fontSize: '0.8rem', color: '#38a169', fontWeight: 'bold' }}>
                        ↑ {levelLabel(s.playing_level as PlayingLevel)}
                      </span>
                    )}
                  </div>
                )}
                {s.notes && <div style={{ color: '#666', marginTop: '0.2rem' }}>{s.notes}</div>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import type { Composer, Piece } from '../api/types'

export default function PieceForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = id !== undefined
  const navigate = useNavigate()

  const [composers, setComposers] = useState<Composer[]>([])
  const [title, setTitle] = useState('')
  const [composerId, setComposerId] = useState('')
  const [difficulty, setDifficulty] = useState(5)
  const [status, setStatus] = useState('wishlist')
  const [startedAt, setStartedAt] = useState('')

  useEffect(() => {
    api.composers.list().then(setComposers)
    if (isEdit) {
      api.pieces.get(Number(id)).then(p => {
        setTitle(p.title)
        setComposerId(String(p.composer_id))
        setDifficulty(p.difficulty)
        setStatus(p.status)
        setStartedAt(p.started_at ? p.started_at.slice(0, 10) : '')
      })
    }
  }, [id])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      title,
      composer_id: Number(composerId),
      difficulty,
      status: status as Piece['status'],
      started_at: startedAt ? new Date(startedAt).toISOString() : null,
    }
    if (isEdit) {
      await api.pieces.update(Number(id), data)
      navigate(`/pieces/${id}`)
    } else {
      const p = await api.pieces.create(data)
      navigate(`/pieces/${p.id}`)
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: '2rem auto', padding: '2.5rem', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.07)' }}>
      <h1 style={{ textAlign: 'center', marginTop: 0 }}>{isEdit ? 'Edit Piece' : 'Add Piece'}</h1>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <label>
          Title
          <input required style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.25rem' }} value={title} onChange={e => setTitle(e.target.value)} />
        </label>
        <label>
          Composer
          <select required style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.25rem' }} value={composerId} onChange={e => setComposerId(e.target.value)}>
            <option value="">Select a composer</option>
            {composers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label>
          Difficulty (1–10)
          <input type="number" min={1} max={10} style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.25rem' }} value={difficulty} onChange={e => setDifficulty(Number(e.target.value))} />
        </label>
        <label>
          Status
          <select style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.25rem' }} value={status} onChange={e => setStatus(e.target.value)}>
            <option value="wishlist">Wishlist</option>
            <option value="learning">Learning</option>
            <option value="active">Active</option>
            <option value="shelved">Shelved</option>
          </select>
        </label>
        <label>
          Started At
          <input type="date" style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.25rem' }} value={startedAt} onChange={e => setStartedAt(e.target.value)} />
        </label>
        <button type="submit" style={{ padding: '0.75rem', background: '#3182ce', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '1rem' }}>
          {isEdit ? 'Save Changes' : 'Add Piece'}
        </button>
      </form>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { Composer } from '../api/types'
import { COMPOSER_NATIONALITIES } from '../api/types'

export default function Composers() {
  const [composers, setComposers] = useState<Composer[]>([])
  const [name, setName] = useState('')
  const [nationality, setNationality] = useState('')
  const [bornYear, setBornYear] = useState('')
  const [diedYear, setDiedYear] = useState('')
  const [showForm, setShowForm] = useState(false)

  const load = () => api.composers.list().then(setComposers)

  useEffect(() => { load() }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    await api.composers.create({
      name,
      nationality: nationality as Composer['nationality'],
      born_year: bornYear ? Number(bornYear) : null,
      died_year: diedYear ? Number(diedYear) : null,
    })
    setName('')
    setNationality('')
    setBornYear('')
    setDiedYear('')
    setShowForm(false)
    load()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Composers</h1>
        <button onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Cancel' : '+ Add Composer'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0', flexWrap: 'wrap' }}>
          <input required placeholder="Name" value={name} onChange={e => setName(e.target.value)} style={{ padding: '0.5rem', flex: 2 }} />
          <select value={nationality} onChange={e => setNationality(e.target.value)} style={{ padding: '0.5rem', minWidth: 160 }}>
            <option value="">Nationality</option>
            {COMPOSER_NATIONALITIES.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <input placeholder="Born year" type="number" value={bornYear} onChange={e => setBornYear(e.target.value)} style={{ padding: '0.5rem', width: 120 }} />
          <input placeholder="Died year" type="number" value={diedYear} onChange={e => setDiedYear(e.target.value)} style={{ padding: '0.5rem', width: 120 }} />
          <button type="submit">Add</button>
        </form>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Name</th>
            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Nationality</th>
            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Born</th>
            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Died</th>
          </tr>
        </thead>
        <tbody>
          {composers.map(c => (
            <tr key={c.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.5rem' }}>{c.name}</td>
              <td style={{ padding: '0.5rem' }}>{c.nationality || '—'}</td>
              <td style={{ padding: '0.5rem' }}>{c.born_year ?? '—'}</td>
              <td style={{ padding: '0.5rem' }}>{c.died_year ?? '—'}</td>
            </tr>
          ))}
          {composers.length === 0 && (
            <tr>
              <td colSpan={4} style={{ padding: '1rem', textAlign: 'center', color: '#888' }}>
                No composers yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

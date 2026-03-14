import type { Composer, Piece, PlaySession, PlayingLevel, User } from './types'

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(path, { ...options, headers })
  if (res.status === 401) {
    localStorage.removeItem('token')
    window.location.href = '/login'
    return undefined as T
  }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  if (res.status === 204) return undefined as T
  return res.json()
}

export const authApi = {
  register: (username: string, password: string) =>
    req<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }),
  login: (username: string, password: string) =>
    req<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }),
}

export const api = {
  composers: {
    list: () => req<Composer[]>('/api/composers'),
    get: (id: number) => req<Composer>(`/api/composers/${id}`),
    create: (data: Partial<Composer>) =>
      req<Composer>('/api/composers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Composer>) =>
      req<Composer>(`/api/composers/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  },
  pieces: {
    list: (params?: { status?: string; composer_id?: number; stale_days?: number }) => {
      const qs = new URLSearchParams()
      if (params?.status) qs.set('status', params.status)
      if (params?.composer_id) qs.set('composer_id', String(params.composer_id))
      if (params?.stale_days) qs.set('stale_days', String(params.stale_days))
      const query = qs.toString() ? `?${qs}` : ''
      return req<Piece[]>(`/api/pieces${query}`)
    },
    get: (id: number) => req<Piece>(`/api/pieces/${id}`),
    create: (data: Partial<Piece>) =>
      req<Piece>('/api/pieces', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Piece>) =>
      req<Piece>(`/api/pieces/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    delete: (id: number) => req<void>(`/api/pieces/${id}`, { method: 'DELETE' }),
  },
  sessions: {
    list: (pieceId: number) => req<PlaySession[]>(`/api/pieces/${pieceId}/sessions`),
    create: (pieceId: number, data: { notes?: string; played_at?: string; playing_level?: PlayingLevel }) =>
      req<PlaySession>(`/api/pieces/${pieceId}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
  },
}

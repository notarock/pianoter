export interface Composer {
  id: number
  name: string
  born_year: number | null
  died_year: number | null
}

export interface Piece {
  id: number
  title: string
  composer_id: number
  composer: Composer
  difficulty: number
  status: 'wishlist' | 'learning' | 'active' | 'shelved'
  started_at: string | null
  last_played_at: string | null
}

export interface PlaySession {
  id: number
  piece_id: number
  played_at: string
  notes: string
}

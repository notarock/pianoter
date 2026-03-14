export interface User {
  id: number
  username: string
}

export interface Composer {
  id: number
  name: string
  born_year: number | null
  died_year: number | null
}

export const PLAYING_LEVELS = [
  { key: 'hands_separate',      label: 'Hands separate',       description: 'Each hand drilled alone — learning notes, fingering, muscle memory' },
  { key: 'hands_together_slow', label: 'Hands together, slow', description: 'Coordination work below tempo — brain connecting both hands' },
  { key: 'up_to_tempo',         label: 'Up to tempo',          description: 'Target BPM reached, but mechanical — no expression yet' },
  { key: 'with_expression',     label: 'With expression',      description: 'Dynamics, phrasing, pedal, tone color added' },
  { key: 'performance_ready',   label: 'Performance ready',    description: 'Consistent and polished — could play it for someone today' },
  { key: 'mastered',            label: 'Mastered',             description: 'Fully internalized — stays reliable without much upkeep' },
] as const

export type PlayingLevel = typeof PLAYING_LEVELS[number]['key']

export interface Piece {
  id: number
  title: string
  composer_id: number
  composer: Composer
  difficulty: number
  status: 'wishlist' | 'learning' | 'active' | 'shelved'
  started_at: string | null
  last_played_at: string | null
  current_level: PlayingLevel | ''
}

export interface PlaySession {
  id: number
  piece_id: number
  played_at: string
  notes: string
  playing_level: PlayingLevel | ''
}

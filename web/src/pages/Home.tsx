import { Link } from 'react-router-dom'
import { Anchor, Button, Group, Text, Title } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import Repertoire from './Repertoire'
import type { Composer, Piece } from '../api/types'
import './Home.css'

const composers: Composer[] = [
  { id: 1, user_id: 0, name: 'Frédéric Chopin', nationality: 'Polish', born_year: 1810, died_year: 1849 },
  { id: 2, user_id: 0, name: 'Erik Satie', nationality: 'French', born_year: 1866, died_year: 1925 },
  { id: 3, user_id: 0, name: 'Claude Debussy', nationality: 'French', born_year: 1862, died_year: 1918 },
]

const exampleData: { pieces: Piece[]; composers: Composer[] } = {
  composers,
  pieces: [
    { id: 1, title: 'Prélude en mi mineur', opus: 'Op. 28', number: '4', composer_id: 1, composer: composers[0], difficulty: 4, status: 'learning', started_at: '2026-10-01', last_played_at: '2026-10-26', current_level: 'hands_together_slow', notes: '' },
    { id: 2, title: 'Prélude en la majeur', opus: 'Op. 28', number: '7', composer_id: 1, composer: composers[0], difficulty: 3, status: 'active', started_at: '2026-09-01', last_played_at: '2026-10-24', current_level: 'performance_ready', notes: '' },
    { id: 3, title: 'Gymnopédie No. 1', opus: 'Trois Gymnopédies', number: '1', composer_id: 2, composer: composers[1], difficulty: 4, status: 'active', started_at: '2026-09-01', last_played_at: '2026-10-20', current_level: 'with_expression', notes: '' },
    { id: 4, title: 'Clair de lune', opus: 'Suite bergamasque', number: '3', composer_id: 3, composer: composers[2], difficulty: 7, status: 'wishlist', started_at: null, last_played_at: null, current_level: '', notes: '' },
  ],
}

export default function Home() {
  const { t } = useTranslation()
  const { token } = useAuth()

  return (
    <div className="home">
      <section className="home-intro" aria-label="Pianoter">
        <Title order={1} mb="lg">Pianoter</Title>
        <Text component="p" className="home-description">
          {t('home.intro')}
        </Text>
        <Group justify="center" gap="xl" mt="xl">
          <Button component={Link} to={token ? '/dashboard' : '/register'} size="md">
            {t(token ? 'home.openDashboard' : 'register.title')}
          </Button>
          {!token && <Anchor component={Link} to="/login" c="dark">{t('login.submitBtn')}</Anchor>}
        </Group>
      </section>

      <figure className="home-preview">
        <div className="home-preview-content">
          <Repertoire exampleData={exampleData} />
        </div>
        <Text component="figcaption" size="xs" c="dimmed" ta="center" py="sm">{t('home.example')}</Text>
      </figure>

      <section className="home-features" aria-label={t('home.features')}>
        {['repertoire', 'practice', 'progress'].map(feature => (
          <div key={feature}>
            <Title order={2} size="h3" mb="sm">{t(`home.${feature}Title`)}</Title>
            <Text size="sm" c="dimmed" lh={1.8}>{t(`home.${feature}Description`)}</Text>
          </div>
        ))}
      </section>

      <footer className="home-footer">
        <Text size="sm" c="dimmed">Pianoter</Text>
        <Anchor href="https://github.com/notarock/pianoter" size="sm" c="dimmed">{t('home.source')}</Anchor>
      </footer>
    </div>
  )
}

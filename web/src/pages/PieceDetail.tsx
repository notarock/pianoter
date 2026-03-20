import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Title, Group, Button, Badge, Stack, Table,
  Text, Textarea, NativeSelect, Box, Timeline,
} from '@mantine/core'
import { api } from '../api/client'
import { PLAYING_LEVELS } from '../api/types'
import type { Piece, PlaySession, PlayingLevel } from '../api/types'
import { statusColor, formatDate } from '../utils'

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

  if (!piece) return <Text>Loading...</Text>

  // Sessions ordered oldest→newest for progression analysis
  const chronological = [...sessions].reverse()

  const levelChanges: { level: PlayingLevel; date: string }[] = []
  for (const s of chronological) {
    if (s.playing_level && (levelChanges.length === 0 || levelChanges[levelChanges.length - 1].level !== s.playing_level)) {
      levelChanges.push({ level: s.playing_level as PlayingLevel, date: s.played_at })
    }
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <Title order={1} style={{ fontFamily: 'Playfair Display, serif' }}>{piece.title}</Title>
        <Group gap="sm">
          <Button component={Link} to={`/pieces/${id}/edit`} variant="default">Edit</Button>
          <Button onClick={deletePiece} color="red" variant="light">Delete</Button>
        </Group>
      </Group>

      {/* Metadata */}
      <Table w="auto" withRowBorders={false} verticalSpacing={4}>
        <Table.Tbody>
          <Table.Tr>
            <Table.Td c="dimmed" pr="xl">Composer</Table.Td>
            <Table.Td>{piece.composer?.name ?? '—'}</Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td c="dimmed" pr="xl">Difficulty</Table.Td>
            <Table.Td>{piece.difficulty}/10</Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td c="dimmed" pr="xl">Status</Table.Td>
            <Table.Td>
              <Badge color={statusColor(piece.status)} variant="light" radius="sm">
                {piece.status}
              </Badge>
            </Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td c="dimmed" pr="xl">Started</Table.Td>
            <Table.Td>{formatDate(piece.started_at) ?? '—'}</Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td c="dimmed" pr="xl">Last Played</Table.Td>
            <Table.Td>{formatDate(piece.last_played_at) ?? 'Never'}</Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td c="dimmed" pr="xl">Current Level</Table.Td>
            <Table.Td>{levelLabel(piece.current_level)}</Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>

      {/* Log session */}
      <Box>
        <Button
          variant={logging ? 'default' : 'filled'}
          onClick={() => setLogging(v => !v)}
        >
          {logging ? 'Cancel' : '+ Log Practice Session'}
        </Button>
        {logging && (
          <Stack gap="sm" mt="sm">
            <Group align="flex-end">
              <Textarea
                placeholder="Notes (optional)"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                autosize
                minRows={1}
                style={{ flex: 1 }}
              />
              <Button onClick={logSession}>Save</Button>
            </Group>
            <Box>
              <NativeSelect
                value={playingLevel}
                onChange={e => setPlayingLevel(e.target.value as PlayingLevel | '')}
                data={[
                  { value: '', label: '— No level recorded —' },
                  ...PLAYING_LEVELS.map(l => ({ value: l.key, label: l.label })),
                ]}
              />
              {playingLevel && (
                <Text size="sm" c="dimmed" mt={4}>{levelDescription(playingLevel)}</Text>
              )}
            </Box>
          </Stack>
        )}
      </Box>

      {/* Level progression */}
      {levelChanges.length > 1 && (
        <Box>
          <Title order={2} mb="sm" style={{ fontFamily: 'Playfair Display, serif' }}>Level Progression</Title>
          <Table striped withTableBorder verticalSpacing="xs" fz="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Level</Table.Th>
                <Table.Th>Reached</Table.Th>
                <Table.Th>Days spent</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {levelChanges.map((lc, i) => {
                const start = new Date(lc.date)
                const end = i + 1 < levelChanges.length ? new Date(levelChanges[i + 1].date) : new Date()
                const days = Math.round((end.getTime() - start.getTime()) / 86400000)
                return (
                  <Table.Tr key={lc.level}>
                    <Table.Td>{levelLabel(lc.level)}</Table.Td>
                    <Table.Td>{start.toLocaleDateString()}</Table.Td>
                    <Table.Td>{i + 1 < levelChanges.length ? `${days}d` : `${days}d (ongoing)`}</Table.Td>
                  </Table.Tr>
                )
              })}
            </Table.Tbody>
          </Table>
        </Box>
      )}

      {/* Practice history */}
      <Box>
        <Title order={2} mb="sm" style={{ fontFamily: 'Playfair Display, serif' }}>Practice History</Title>
        {sessions.length === 0 ? (
          <Text c="dimmed">No sessions logged yet.</Text>
        ) : (
          <Timeline active={sessions.length} bulletSize={12} lineWidth={2}>
            {sessions.map((s, i) => {
              const prevLevel = sessions[i + 1]?.playing_level ?? ''
              const levelChanged = s.playing_level && s.playing_level !== prevLevel
              return (
                <Timeline.Item key={s.id} title={new Date(s.played_at).toLocaleString()}>
                  {s.playing_level && (
                    <Group gap="xs" mt={4}>
                      <Badge variant="light" color="blue" size="sm">
                        {levelLabel(s.playing_level as PlayingLevel)}
                      </Badge>
                      {levelChanged && (
                        <Text size="sm" c="green" fw={600}>
                          ↑ {levelLabel(s.playing_level as PlayingLevel)}
                        </Text>
                      )}
                    </Group>
                  )}
                  {s.notes && <Text size="sm" c="dimmed" mt={4}>{s.notes}</Text>}
                </Timeline.Item>
              )
            })}
          </Timeline>
        )}
      </Box>
    </Stack>
  )
}

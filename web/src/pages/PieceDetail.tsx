import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Title, Group, Button, Badge, Stack, Table,
  Text, Textarea, NativeSelect, Box, Timeline, Breadcrumbs, Anchor, Progress, Modal,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { Trans, useTranslation } from 'react-i18next'
import { api } from '../api/client'
import { PLAYING_LEVELS } from '../api/types'
import type { Piece, PlaySession, PlayingLevel } from '../api/types'
import { statusColor, formatDate } from '../utils'
import { notifications } from '@mantine/notifications'

export default function PieceDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [piece, setPiece] = useState<Piece | null>(null)
  const [sessions, setSessions] = useState<PlaySession[]>([])
  const [notes, setNotes] = useState('')
  const [playingLevel, setPlayingLevel] = useState<PlayingLevel | ''>('')
  const [logging, setLogging] = useState(false)
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false)

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
    notifications.show({ message: t('pieceDetail.notifLogged'), color: 'teal' })
    setNotes('')
    setPlayingLevel('')
    setLogging(false)
    load()
  }

  const deletePiece = async () => {
    await api.pieces.delete(Number(id))
    navigate('/repertoire')
  }

  if (!piece) return <Text>{t('common.loading')}</Text>

  // Sessions ordered oldest→newest for progression analysis
  const chronological = [...sessions].reverse()

  const levelChanges: { level: PlayingLevel; date: string }[] = []
  for (const s of chronological) {
    if (s.playing_level && (levelChanges.length === 0 || levelChanges[levelChanges.length - 1].level !== s.playing_level)) {
      levelChanges.push({ level: s.playing_level as PlayingLevel, date: s.played_at })
    }
  }

  const levelLabel = (key: PlayingLevel | '') => {
    if (!key) return '—'
    const levelKey = key as string
    return t(`levels.${levelKey}.label`, { defaultValue: key })
  }

  const levelDescription = (key: PlayingLevel | '') => {
    if (!key) return ''
    const levelKey = key as string
    return t(`levels.${levelKey}.description`, { defaultValue: '' })
  }

  return (
    <Stack gap="lg">
      <Breadcrumbs fz="sm" c="dimmed">
        <Anchor component={Link} to="/repertoire" c="dimmed" fz="sm">{t('nav.repertoire')}</Anchor>
        <Text span fz="sm" c="#1A1612">{piece.title}</Text>
      </Breadcrumbs>

      <Group justify="space-between" align="center">
        <Title order={1} style={{ fontFamily: 'Playfair Display, serif' }}>{piece.title}</Title>
        <Group gap="sm">
          <Button component={Link} to={`/pieces/${id}/edit`} variant="default">{t('common.edit', 'Edit')}</Button>
          <Button onClick={openDelete} color="red" variant="light">{t('common.delete', 'Delete')}</Button>
        </Group>
      </Group>

      {/* Metadata */}
      <Table w="auto" withRowBorders={false} verticalSpacing={4}>
        <Table.Tbody>
          <Table.Tr>
            <Table.Td c="dimmed" pr="xl">{t('pieceDetail.colComposer')}</Table.Td>
            <Table.Td>{piece.composer?.name ?? '—'}</Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td c="dimmed" pr="xl">{t('pieceDetail.colDifficulty')}</Table.Td>
            <Table.Td>
              <Group gap="sm" align="center">
                <Progress
                  value={piece.difficulty * 10}
                  color="terracotta"
                  size="sm"
                  w={80}
                />
                <Text size="sm">{piece.difficulty}/10</Text>
              </Group>
            </Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td c="dimmed" pr="xl">{t('pieceDetail.colStatus')}</Table.Td>
            <Table.Td>
              <Badge color={statusColor(piece.status)} variant="light" radius="sm">
                {t(`status.${piece.status}`)}
              </Badge>
            </Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td c="dimmed" pr="xl">{t('pieceDetail.colStarted')}</Table.Td>
            <Table.Td>{formatDate(piece.started_at) ?? '—'}</Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td c="dimmed" pr="xl">{t('pieceDetail.colLastPlayed')}</Table.Td>
            <Table.Td>{formatDate(piece.last_played_at) ?? t('common.never')}</Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td c="dimmed" pr="xl">{t('pieceDetail.colCurrentLevel')}</Table.Td>
            <Table.Td>{levelLabel(piece.current_level)}</Table.Td>
          </Table.Tr>
          {piece.notes && (
            <Table.Tr>
              <Table.Td c="dimmed" pr="xl" style={{ verticalAlign: 'top' }}>{t('pieceDetail.colNotes')}</Table.Td>
              <Table.Td style={{ whiteSpace: 'pre-wrap' }}>{piece.notes}</Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>

      {/* Log session */}
      <Box>
        <Button
          variant={logging ? 'default' : 'filled'}
          onClick={() => setLogging(v => !v)}
        >
          {logging ? t('pieceDetail.cancelLog') : t('pieceDetail.logSession')}
        </Button>
        {logging && (
          <Stack gap="sm" mt="sm">
            <Group align="flex-end">
              <Textarea
                placeholder={t('pieceDetail.notesPlaceholder')}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                autosize
                minRows={1}
                style={{ flex: 1 }}
              />
              <Button onClick={logSession}>{t('pieceDetail.saveSession')}</Button>
            </Group>
            <Box>
              <NativeSelect
                value={playingLevel}
                onChange={e => setPlayingLevel(e.target.value as PlayingLevel | '')}
                data={[
                  { value: '', label: t('pieceDetail.noLevel') },
                  ...PLAYING_LEVELS.map(l => ({ value: l.key, label: t(`levels.${l.key}.label`) })),
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
          <Title order={2} mb="sm" style={{ fontFamily: 'Playfair Display, serif' }}>{t('pieceDetail.levelProgressionTitle')}</Title>
          <Table striped withTableBorder verticalSpacing="xs" fz="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('pieceDetail.colLevel')}</Table.Th>
                <Table.Th>{t('pieceDetail.colReached')}</Table.Th>
                <Table.Th>{t('pieceDetail.colDaysSpent')}</Table.Th>
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
                    <Table.Td>
                      {i + 1 < levelChanges.length
                        ? t('pieceDetail.days', { count: days })
                        : t('pieceDetail.daysOngoing', { count: days })}
                    </Table.Td>
                  </Table.Tr>
                )
              })}
            </Table.Tbody>
          </Table>
        </Box>
      )}

      {/* Practice history */}
      <Box>
        <Title order={2} mb="sm" style={{ fontFamily: 'Playfair Display, serif' }}>{t('pieceDetail.practiceHistoryTitle')}</Title>
        {sessions.length === 0 ? (
          <Text c="dimmed">{t('pieceDetail.noSessions')}</Text>
        ) : (
          <Timeline active={sessions.length} bulletSize={12} lineWidth={2}>
            {sessions.map((s, i) => {
              const prevLevel = sessions[i + 1]?.playing_level ?? ''
              const levelChanged = s.playing_level && s.playing_level !== prevLevel
              return (
                <Timeline.Item key={s.id} title={new Date(s.played_at).toLocaleString()}>
                  {s.playing_level && (
                    <Group gap="xs" mt={4}>
                      <Badge variant="light" color="gray" size="sm">
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

      {/* Delete confirmation modal */}
      <Modal
        opened={deleteOpened}
        onClose={closeDelete}
        title={t('pieceDetail.deleteModal.title')}
        centered
        size="sm"
      >
        <Text size="sm" c="dimmed" mb="lg">
          <Trans
            i18nKey="pieceDetail.deleteModal.desc"
            values={{ title: piece.title }}
            components={{ bold: <strong /> }}
          />
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={closeDelete}>{t('pieceDetail.deleteModal.cancel')}</Button>
          <Button color="red" onClick={deletePiece}>{t('pieceDetail.deleteModal.delete')}</Button>
        </Group>
      </Modal>
    </Stack>
  )
}

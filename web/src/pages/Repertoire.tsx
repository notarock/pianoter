import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Title, Group, Button, Select, Table, Badge,
  Anchor, Text, Center, Stack, TextInput,
} from '@mantine/core'
import { Trans, useTranslation } from 'react-i18next'
import { api } from '../api/client'
import type { Piece, Composer } from '../api/types'
import { statusColor, formatDate } from '../utils'

export default function Repertoire() {
  const { t } = useTranslation()
  const [pieces, setPieces] = useState<Piece[]>([])
  const [composers, setComposers] = useState<Composer[]>([])
  const [status, setStatus] = useState<string | null>(null)
  const [composerId, setComposerId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.composers.list().then(setComposers)
  }, [])

  useEffect(() => {
    api.pieces
      .list({
        status: status || undefined,
        composer_id: composerId ? Number(composerId) : undefined,
      })
      .then(setPieces)
  }, [status, composerId])

  const composerOptions = composers.map(c => ({ value: String(c.id), label: c.name }))

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <Title order={1} style={{ fontFamily: 'Playfair Display, serif' }}>{t('repertoire.title')}</Title>
        <Button component={Link} to="/pieces/new">{t('repertoire.addPiece')}</Button>
      </Group>

      {/* Filters */}
      <Group gap="sm" wrap="wrap">
        <Select
          placeholder={t('repertoire.allStatuses')}
          value={status}
          onChange={setStatus}
          clearable
          data={[
            { value: 'wishlist', label: t('status.wishlist') },
            { value: 'learning', label: t('status.learning') },
            { value: 'active',   label: t('status.active')   },
            { value: 'shelved',  label: t('status.shelved')  },
          ]}
          w={160}
        />
        <Select
          placeholder={t('repertoire.allComposers')}
          value={composerId}
          onChange={setComposerId}
          clearable
          searchable
          data={composerOptions}
          w={220}
        />
        <TextInput
          placeholder={t('repertoire.searchPlaceholder')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          w={200}
        />
      </Group>

      {/* Table — always rendered so headers are always visible */}
      <Table striped highlightOnHover withTableBorder verticalSpacing="sm">
        <Table.Thead style={{ background: '#f5f5f5' }}>
          <Table.Tr>
            <Table.Th>{t('repertoire.colTitle')}</Table.Th>
            <Table.Th>{t('repertoire.colComposer')}</Table.Th>
            <Table.Th>{t('repertoire.colDifficulty')}</Table.Th>
            <Table.Th>{t('repertoire.colStatus')}</Table.Th>
            <Table.Th>{t('repertoire.colLastPlayed')}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {pieces.filter(p => !search || p.title.toLowerCase().includes(search.toLowerCase())).map(p => (
            <Table.Tr key={p.id}>
              <Table.Td>
                <Anchor component={Link} to={`/pieces/${p.id}`} c="dark" fw={500}>
                  {p.title}
                </Anchor>
              </Table.Td>
              <Table.Td c="dimmed">
                {p.composer
                  ? <Anchor component={Link} to={`/composers/${p.composer.id}`} c="dimmed" size="sm">{p.composer.name}</Anchor>
                  : '—'}
              </Table.Td>
              <Table.Td>{p.difficulty}/10</Table.Td>
              <Table.Td>
                <Badge color={statusColor(p.status)} variant="light" radius="sm">
                  {t(`status.${p.status}`)}
                </Badge>
              </Table.Td>
              <Table.Td>{formatDate(p.last_played_at) ?? t('common.never')}</Table.Td>
            </Table.Tr>
          ))}
          {pieces.filter(p => !search || p.title.toLowerCase().includes(search.toLowerCase())).length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={5}>
                {!status && !composerId && !search ? (
                  <Center py={48}>
                    <Stack align="center" gap="sm">
                      <Text size="2.5rem" lh={1}>🎹</Text>
                      <Text fw={600} size="lg" c="#1A1612">{t('repertoire.noPiecesTitle')}</Text>
                      <Text c="dimmed" size="sm">
                        <Trans
                          i18nKey="repertoire.noPiecesDesc"
                          components={{ bold: <strong /> }}
                        />
                      </Text>
                    </Stack>
                  </Center>
                ) : (
                  <Text c="dimmed" ta="center" py="xl">{t('repertoire.noMatchFilters')}</Text>
                )}
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </Stack>
  )
}

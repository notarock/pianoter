import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Title, Group, Button, NativeSelect, Badge,
  Anchor, Center, Stack, TextInput, SegmentedControl, Accordion, Text,
} from '@mantine/core'
import { DataTable, type DataTableSortStatus } from 'mantine-datatable'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'
import type { Piece, Composer } from '../api/types'
import { statusColor, formatDate } from '../utils'

const PAGE_SIZE = 20

export default function Repertoire() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [pieces, setPieces] = useState<Piece[]>([])
  const [composers, setComposers] = useState<Composer[]>([])
  const [status, setStatus] = useState('')
  const [composerId, setComposerId] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [grouped, setGrouped] = useState(true)
  const [groupBy, setGroupBy] = useState<'composer' | 'opus' | 'composer-opus'>('composer-opus')
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<Piece>>({
    columnAccessor: 'title',
    direction: 'asc',
  })

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

  useEffect(() => { setPage(1) }, [status, composerId, search, sortStatus])

  const composerOptions = composers.map(c => ({ value: String(c.id), label: c.name }))

  const filtered = useMemo(() =>
    pieces.filter(p => !search || p.title.toLowerCase().includes(search.toLowerCase()) || (p.opus || '').toLowerCase().includes(search.toLowerCase()) || (p.number || '').toLowerCase().includes(search.toLowerCase())),
    [pieces, search])

  const sorted = useMemo(() => {
    const { columnAccessor, direction } = sortStatus
    return [...filtered].sort((a, b) => {
      let av: unknown = a[columnAccessor as keyof Piece]
      let bv: unknown = b[columnAccessor as keyof Piece]
      if (columnAccessor === 'composer') { av = a.composer?.name ?? ''; bv = b.composer?.name ?? '' }
      if (av == null) return 1
      if (bv == null) return -1
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv))
      return direction === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortStatus])

  const paginated = useMemo(() =>
    sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [sorted, page])

  const groupedItems = useMemo(() => {
    if (!grouped) return null
    const groups: Record<string, Piece[]> = {}
    for (const p of sorted) {
      let key: string
      if (groupBy === 'composer') {
        key = p.composer?.name || '(no composer)'
      } else if (groupBy === 'opus') {
        key = p.opus || '(no opus)'
      } else {
        const composer = p.composer?.name || '(no composer)'
        const opus = p.opus || '(no opus)'
        key = `${composer} — ${opus}`
      }
      if (!groups[key]) groups[key] = []
      groups[key].push(p)
    }
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, pieces]) => ({ name, pieces }))
  }, [sorted, grouped, groupBy])

  const groupColumns = [
    {
      accessor: 'title' as const,
      title: t('repertoire.colTitle'),
      sortable: true,
      render: (p: Piece) => (
        <Anchor component={Link} to={`/pieces/${p.id}`} c="dark" fw={500}>
          {p.title}
        </Anchor>
      ),
    },
    {
      accessor: 'composer' as const,
      title: t('repertoire.colComposer'),
      sortable: true,
      render: (p: Piece) => p.composer
        ? <Anchor component={Link} to={`/composers/${p.composer.id}`} c="dimmed" size="sm">{p.composer.name}</Anchor>
        : '—',
    },
    {
      accessor: 'opus' as const,
      title: t('repertoire.colOpus'),
      sortable: true,
      render: (p: Piece) => p.opus || '—',
    },
    {
      accessor: 'number' as const,
      title: t('repertoire.colNumber'),
      sortable: true,
      render: (p: Piece) => p.number || '—',
    },
    {
      accessor: 'difficulty' as const,
      title: t('repertoire.colDifficulty'),
      sortable: true,
      render: (p: Piece) => `${p.difficulty}/10`,
    },
    {
      accessor: 'status' as const,
      title: t('repertoire.colStatus'),
      sortable: true,
      render: (p: Piece) => (
        <Badge color={statusColor(p.status)} variant="light" radius="sm">
          {t(`status.${p.status}`)}
        </Badge>
      ),
    },
    {
      accessor: 'last_played_at' as const,
      title: t('repertoire.colLastPlayed'),
      sortable: true,
      render: (p: Piece) => formatDate(p.last_played_at) ?? t('common.never'),
    },
  ]

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <Title order={1} style={{ fontFamily: 'Playfair Display, serif' }}>{t('repertoire.title')}</Title>
        <Group gap="sm">
          <SegmentedControl
            size="sm"
            value={grouped ? 'grouped' : 'flat'}
            onChange={v => { setGrouped(v === 'grouped'); setPage(1) }}
            data={[
              { value: 'flat', label: t('repertoire.flat') },
              { value: 'grouped', label: t('repertoire.grouped') },
            ]}
          />
          {grouped && (
            <NativeSelect
              value={groupBy}
              onChange={e => { setGroupBy(e.target.value as typeof groupBy); setPage(1) }}
              data={[
                { value: 'composer', label: t('repertoire.groupByComposer') },
                { value: 'opus', label: t('repertoire.groupByOpus') },
                { value: 'composer-opus', label: t('repertoire.groupByComposerAndOpus') },
              ]}
              w={200}
            />
          )}
        </Group>
        <Button component={Link} to="/pieces/new">{t('repertoire.addPiece')}</Button>
      </Group>

      <Group gap="sm" wrap="wrap">
        <NativeSelect
          value={status}
          onChange={e => setStatus(e.target.value)}
          data={[
            { value: '', label: t('repertoire.allStatuses') },
            { value: 'wishlist', label: t('status.wishlist') },
            { value: 'learning', label: t('status.learning') },
            { value: 'active',   label: t('status.active')   },
            { value: 'shelved',  label: t('status.shelved')  },
          ]}
          w={160}
        />
        <NativeSelect
          value={composerId}
          onChange={e => setComposerId(e.target.value)}
          data={[
            { value: '', label: t('repertoire.allComposers') },
            ...composerOptions,
          ]}
          w={220}
        />
        <TextInput
          placeholder={t('repertoire.searchPlaceholder')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          w={200}
        />
      </Group>

      {groupedItems ? (
        <Stack gap="sm">
          {(() => {
            const start = (page - 1) * PAGE_SIZE
            const end = start + PAGE_SIZE
            const visibleItems = groupedItems.slice(start, end)
            return visibleItems.map((item, i) => (
              <Accordion key={item.name} variant="separated">
                <Accordion.Item value={`${item.name}-${i}`}>
                  <Accordion.Control>
                    <Text span fw={500}>{item.name}</Text>
                    <Text span c="dimmed" ml="sm">({item.pieces.length})</Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <DataTable
                      striped
                      highlightOnHover
                      withTableBorder
                      verticalSpacing="sm"
                      records={item.pieces}
                      sortStatus={sortStatus}
                      onSortStatusChange={setSortStatus}
                      columns={groupColumns}
                    />
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>
            ))
          })()}
          {groupedItems.length > PAGE_SIZE && (
            <Group justify="center" gap="sm" mt="sm">
              <Button
                variant="default"
                size="xs"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                ←
              </Button>
              <Text size="sm" c="dimmed">
                {page} / {Math.ceil(groupedItems.length / PAGE_SIZE)}
              </Text>
              <Button
                variant="default"
                size="xs"
                disabled={page >= Math.ceil(groupedItems.length / PAGE_SIZE)}
                onClick={() => setPage(p => p + 1)}
              >
                →
              </Button>
            </Group>
          )}
        </Stack>
      ) : (
        <DataTable
          striped
          highlightOnHover
          withTableBorder
          verticalSpacing="sm"
          records={paginated}
          totalRecords={filtered.length}
          recordsPerPage={PAGE_SIZE}
          page={page}
          onPageChange={setPage}
          sortStatus={sortStatus}
          onSortStatusChange={setSortStatus}
          noRecordsText={
            pieces.length === 0 && !status && !composerId && !search
              ? t('repertoire.noPiecesTitle')
              : t('repertoire.noMatchFilters')
          }
          columns={groupColumns}
        />
      )}
      {pieces.length === 0 && !status && !composerId && !search && (
        <Center>
          <Button onClick={() => navigate('/pieces/new')}>
            {t('repertoire.addFirstPiece')}
          </Button>
        </Center>
      )}
    </Stack>
  )
}

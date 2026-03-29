import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Title, Group, Button, NativeSelect, Badge,
  Anchor, Center, Stack, TextInput,
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
    pieces.filter(p => !search || p.title.toLowerCase().includes(search.toLowerCase())),
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

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <Title order={1} style={{ fontFamily: 'Playfair Display, serif' }}>{t('repertoire.title')}</Title>
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
          columns={[
            {
              accessor: 'title',
              title: t('repertoire.colTitle'),
              sortable: true,
              render: p => (
                <Anchor component={Link} to={`/pieces/${p.id}`} c="dark" fw={500}>
                  {p.title}
                </Anchor>
              ),
            },
            {
              accessor: 'composer',
              title: t('repertoire.colComposer'),
              sortable: true,
              render: p => p.composer
                ? <Anchor component={Link} to={`/composers/${p.composer.id}`} c="dimmed" size="sm">{p.composer.name}</Anchor>
                : '—',
            },
            {
              accessor: 'difficulty',
              title: t('repertoire.colDifficulty'),
              sortable: true,
              render: p => `${p.difficulty}/10`,
            },
            {
              accessor: 'status',
              title: t('repertoire.colStatus'),
              sortable: true,
              render: p => (
                <Badge color={statusColor(p.status)} variant="light" radius="sm">
                  {t(`status.${p.status}`)}
                </Badge>
              ),
            },
            {
              accessor: 'last_played_at',
              title: t('repertoire.colLastPlayed'),
              sortable: true,
              render: p => formatDate(p.last_played_at) ?? t('common.never'),
            },
          ]}
        />
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

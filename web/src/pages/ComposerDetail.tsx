import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Title, Stack, Badge, Text, Breadcrumbs, Anchor,
  Group, SimpleGrid, Box,
} from '@mantine/core'
import { DataTable, type DataTableSortStatus } from 'mantine-datatable'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'
import type { Composer, Piece } from '../api/types'
import { statusColor, formatDate } from '../utils'

export default function ComposerDetail() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const [composer, setComposer] = useState<Composer | null>(null)
  const [pieces, setPieces] = useState<Piece[]>([])
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<Piece>>({
    columnAccessor: 'title',
    direction: 'asc',
  })

  useEffect(() => {
    const numId = Number(id)
    api.composers.get(numId).then(setComposer)
    api.pieces.list({ composer_id: numId }).then(setPieces)
  }, [id])

  const sorted = useMemo(() => {
    const { columnAccessor, direction } = sortStatus
    return [...pieces].sort((a, b) => {
      const av = a[columnAccessor as keyof Piece] ?? ''
      const bv = b[columnAccessor as keyof Piece] ?? ''
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv))
      return direction === 'asc' ? cmp : -cmp
    })
  }, [pieces, sortStatus])

  if (!composer) return <Text>{t('common.loading')}</Text>

  const years = [composer.born_year, composer.died_year].filter(Boolean)
  const lifespan = years.length === 2 ? `${years[0]} – ${years[1]}` : years[0] ? `b. ${years[0]}` : null

  return (
    <Stack gap="lg">
      <Breadcrumbs fz="sm" c="dimmed">
        <Anchor component={Link} to="/composers" c="dimmed" fz="sm">{t('nav.composers')}</Anchor>
        <Text span fz="sm" c="#1A1612">{composer.name}</Text>
      </Breadcrumbs>

      <Group align="flex-end" gap="sm">
        <Title order={1} style={{ fontFamily: 'Playfair Display, serif' }}>{composer.name}</Title>
        {composer.user_id === 0 && (
          <Badge size="sm" color="gray" variant="light" mb={4}>{t('composers.systemBadge')}</Badge>
        )}
      </Group>

      <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="md" maw={480}>
        {composer.nationality && (
          <Box>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={2}>{t('composerDetail.labelNationality')}</Text>
            <Text size="sm">{composer.nationality}</Text>
          </Box>
        )}
        {lifespan && (
          <Box>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={2}>{t('composerDetail.labelYears')}</Text>
            <Text size="sm">{lifespan}</Text>
          </Box>
        )}
        <Box>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={2}>{t('composerDetail.labelPieces')}</Text>
          <Text size="sm">{pieces.length}</Text>
        </Box>
      </SimpleGrid>

      {pieces.length > 0 && (
        <Box>
          <Title order={2} mb="sm" style={{ fontFamily: 'Playfair Display, serif' }}>{t('composerDetail.piecesTitle')}</Title>
          <DataTable
            striped
            highlightOnHover
            withTableBorder
            verticalSpacing="sm"
            records={sorted}
            sortStatus={sortStatus}
            onSortStatusChange={setSortStatus}
            columns={[
              {
                accessor: 'title',
                title: t('composerDetail.colTitle'),
                sortable: true,
                render: p => (
                  <Anchor component={Link} to={`/pieces/${p.id}`} c="dark" fw={500}>{p.title}</Anchor>
                ),
              },
              {
                accessor: 'opus',
                title: t('composerDetail.colOpus'),
                sortable: true,
                render: p => p.opus || '—',
              },
              {
                accessor: 'number',
                title: t('composerDetail.colNumber'),
                sortable: true,
                render: p => p.number || '—',
              },
              {
                accessor: 'difficulty',
                title: t('composerDetail.colDifficulty'),
                sortable: true,
                render: p => `${p.difficulty}/10`,
              },
              {
                accessor: 'status',
                title: t('composerDetail.colStatus'),
                sortable: true,
                render: p => (
                  <Badge color={statusColor(p.status)} variant="light" radius="sm">{t(`status.${p.status}`)}</Badge>
                ),
              },
              {
                accessor: 'last_played_at',
                title: t('composerDetail.colLastPlayed'),
                sortable: true,
                render: p => formatDate(p.last_played_at) ?? t('common.never'),
              },
            ]}
          />
        </Box>
      )}

      {pieces.length === 0 && (
        <Text c="dimmed" size="sm">{t('composerDetail.noPieces')}</Text>
      )}
    </Stack>
  )
}

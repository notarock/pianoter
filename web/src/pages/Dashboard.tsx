import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Title, Text, SimpleGrid, Card, Badge, Button,
  Center, Stack, Anchor, SegmentedControl, Group,
} from '@mantine/core'
import { DataTable, type DataTableSortStatus } from 'mantine-datatable'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'
import type { Piece } from '../api/types'
import { useAuth } from '../context/AuthContext'
import { statusColor, formatDate } from '../utils'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [stale, setStale] = useState<Piece[]>([])
  const [all, setAll] = useState<Piece[]>([])
  const [staleDays, setStaleDays] = useState(30)
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<Piece>>({
    columnAccessor: 'last_played_at',
    direction: 'asc',
  })

  useEffect(() => {
    api.pieces.list({ stale_days: staleDays }).then(setStale)
  }, [staleDays])

  useEffect(() => {
    api.pieces.list().then(setAll)
  }, [])

  const byStatus = (s: string) => all.filter(p => p.status === s).length

  const sorted = useMemo(() => {
    const { columnAccessor, direction } = sortStatus
    return [...stale].sort((a, b) => {
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
  }, [stale, sortStatus])

  const STATUS_CARDS = [
    { status: 'wishlist', label: t('status.wishlist') },
    { status: 'learning', label: t('status.learning') },
    { status: 'active',   label: t('status.active')   },
    { status: 'shelved',  label: t('status.shelved')  },
  ] as const

  return (
    <Stack gap="xl">
      <Title order={1} style={{ fontFamily: 'Playfair Display, serif' }}>
        {t('dashboard.welcome', { username: user?.username })}
      </Title>

      <SimpleGrid cols={4} spacing="md">
        {STATUS_CARDS.map(({ status, label }) => (
          <Card
            key={status}
            padding="lg"
            radius="md"
            withBorder
            style={{
              borderColor: 'var(--app-border)',
              cursor: 'pointer',
              transition: 'box-shadow 150ms ease',
            }}
            onClick={() => navigate(`/repertoire?status=${status}`)}
          >
            <Text size="2.25rem" fw={700} c={`${statusColor(status)}.7`} lh={1}>
              {byStatus(status)}
            </Text>
            <Badge mt="xs" color={statusColor(status)} variant="light" radius="sm">
              {label}
            </Badge>
          </Card>
        ))}
      </SimpleGrid>

      {all.length === 0 && (
        <Card
          padding="xl"
          radius="md"
          withBorder
          style={{ borderStyle: 'dashed', borderColor: 'var(--app-border)' }}
        >
          <Center>
            <Stack align="center" gap="sm">
              <Text size="2.5rem" lh={1}>🎼</Text>
              <Text fw={600} size="lg" c="#1A1612">{t('dashboard.emptyTitle')}</Text>
              <Text c="dimmed" size="sm">{t('dashboard.emptyDesc')}</Text>
              <Button onClick={() => navigate('/repertoire')} mt="xs">
                {t('dashboard.goToRepertoire')}
              </Button>
            </Stack>
          </Center>
        </Card>
      )}

      <div>
        <Group justify="space-between" align="center" mb="md">
          <Title order={2} style={{ fontFamily: 'Playfair Display, serif' }}>
            {t('dashboard.toRevisitTitle')}{' '}
            <Text span size="sm" c="dimmed" fw={400}>{t('dashboard.toRevisitSub')}</Text>
          </Title>
          {all.length > 0 && (
            <SegmentedControl
              size="xs"
              value={String(staleDays)}
              onChange={v => setStaleDays(Number(v))}
              data={[
                { label: t('dashboard.days', { count: 7 }),  value: '7'  },
                { label: t('dashboard.days', { count: 14 }), value: '14' },
                { label: t('dashboard.days', { count: 30 }), value: '30' },
                { label: t('dashboard.days', { count: 60 }), value: '60' },
              ]}
            />
          )}
        </Group>

        {stale.length === 0 ? (
          <Text c="dimmed" size="sm">{t('dashboard.allCaughtUp')}</Text>
        ) : (
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
                title: t('dashboard.colTitle'),
                sortable: true,
                render: p => (
                  <Anchor component={Link} to={`/pieces/${p.id}`} c="dark" fw={500}>
                    {p.title}
                  </Anchor>
                ),
              },
              {
                accessor: 'opus',
                title: t('dashboard.colOpus'),
                sortable: true,
                render: p => p.opus || '—',
              },
              {
                accessor: 'number',
                title: t('dashboard.colNumber'),
                sortable: true,
                render: p => p.number || '—',
              },
              {
                accessor: 'composer',
                title: t('dashboard.colComposer'),
                sortable: true,
                render: p => p.composer
                  ? <Anchor component={Link} to={`/composers/${p.composer.id}`} c="dimmed" size="sm">{p.composer.name}</Anchor>
                  : '—',
              },
              {
                accessor: 'last_played_at',
                title: t('dashboard.colLastPlayed'),
                sortable: true,
                render: p => formatDate(p.last_played_at) ?? t('common.never'),
              },
              {
                accessor: 'status',
                title: t('dashboard.colStatus'),
                sortable: true,
                render: p => (
                  <Badge color={statusColor(p.status)} variant="light" radius="sm">
                    {t(`status.${p.status}`)}
                  </Badge>
                ),
              },
            ]}
          />
        )}
      </div>
    </Stack>
  )
}

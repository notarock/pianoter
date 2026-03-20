import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Title, Text, SimpleGrid, Card, Table, Badge, Button,
  Center, Stack, Anchor,
} from '@mantine/core'
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

  useEffect(() => {
    api.pieces.list({ stale_days: 30 }).then(setStale)
    api.pieces.list().then(setAll)
  }, [])

  const byStatus = (s: string) => all.filter(p => p.status === s).length

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

      {/* Status stat cards */}
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
            <Text
              size="2.25rem"
              fw={700}
              c={`${statusColor(status)}.7`}
              lh={1}
            >
              {byStatus(status)}
            </Text>
            <Badge
              mt="xs"
              color={statusColor(status)}
              variant="light"
              radius="sm"
            >
              {label}
            </Badge>
          </Card>
        ))}
      </SimpleGrid>

      {/* Empty repertoire prompt */}
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
              <Button component={Link} to="/repertoire" mt="xs">
                {t('dashboard.goToRepertoire')}
              </Button>
            </Stack>
          </Center>
        </Card>
      )}

      {/* To Revisit */}
      <div>
        <Title order={2} mb="md" style={{ fontFamily: 'Playfair Display, serif' }}>
          {t('dashboard.toRevisitTitle')}{' '}
          <Text span size="sm" c="dimmed" fw={400}>{t('dashboard.toRevisitSub')}</Text>
        </Title>

        {stale.length === 0 ? (
          <Text c="dimmed" size="sm">{t('dashboard.allCaughtUp')}</Text>
        ) : (
          <Table striped highlightOnHover withTableBorder withColumnBorders={false} verticalSpacing="sm">
            <Table.Thead style={{ background: '#f5f5f5' }}>
              <Table.Tr>
                <Table.Th>{t('dashboard.colTitle')}</Table.Th>
                <Table.Th>{t('dashboard.colComposer')}</Table.Th>
                <Table.Th>{t('dashboard.colLastPlayed')}</Table.Th>
                <Table.Th>{t('dashboard.colStatus')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {stale.map(p => (
                <Table.Tr key={p.id}>
                  <Table.Td>
                    <Anchor component={Link} to={`/pieces/${p.id}`} c="terracotta" fw={500}>
                      {p.title}
                    </Anchor>
                  </Table.Td>
                  <Table.Td c="dimmed">
                    {p.composer
                      ? <Anchor component={Link} to={`/composers/${p.composer.id}`} c="dimmed" size="sm">{p.composer.name}</Anchor>
                      : '—'}
                  </Table.Td>
                  <Table.Td>{formatDate(p.last_played_at) ?? t('common.never')}</Table.Td>
                  <Table.Td>
                    <Badge color={statusColor(p.status)} variant="light" radius="sm">
                      {t(`status.${p.status}`)}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </div>
    </Stack>
  )
}

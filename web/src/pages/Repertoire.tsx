import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Title, Group, Button, Select, Table, Badge,
  Anchor, Text, Center, Stack,
} from '@mantine/core'
import { api } from '../api/client'
import type { Piece, Composer } from '../api/types'
import { statusColor, formatDate } from '../utils'

export default function Repertoire() {
  const [pieces, setPieces] = useState<Piece[]>([])
  const [composers, setComposers] = useState<Composer[]>([])
  const [status, setStatus] = useState<string | null>(null)
  const [composerId, setComposerId] = useState<string | null>(null)

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

  const composerOptions = [
    { value: '', label: 'All composers' },
    ...composers.map(c => ({ value: String(c.id), label: c.name })),
  ]

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <Title order={1} style={{ fontFamily: 'Playfair Display, serif' }}>Repertoire</Title>
        <Button component={Link} to="/pieces/new">+ Add Piece</Button>
      </Group>

      {/* Filters */}
      <Group gap="sm">
        <Select
          placeholder="All statuses"
          value={status}
          onChange={setStatus}
          clearable
          data={[
            { value: 'wishlist', label: 'Wishlist' },
            { value: 'learning', label: 'Learning' },
            { value: 'active',   label: 'Active'   },
            { value: 'shelved',  label: 'Shelved'  },
          ]}
          w={160}
        />
        <Select
          placeholder="All composers"
          value={composerId}
          onChange={setComposerId}
          clearable
          searchable
          data={composerOptions.slice(1)}
          w={220}
        />
      </Group>

      {/* Table — always rendered so headers are always visible */}
      <Table striped highlightOnHover withTableBorder verticalSpacing="sm">
        <Table.Thead style={{ background: '#f9f7f4' }}>
          <Table.Tr>
            <Table.Th>Title</Table.Th>
            <Table.Th>Composer</Table.Th>
            <Table.Th>Difficulty</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Last Played</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {pieces.map(p => (
            <Table.Tr key={p.id}>
              <Table.Td>
                <Anchor component={Link} to={`/pieces/${p.id}`} c="terracotta" fw={500}>
                  {p.title}
                </Anchor>
              </Table.Td>
              <Table.Td c="dimmed">{p.composer?.name ?? '—'}</Table.Td>
              <Table.Td>{p.difficulty}/10</Table.Td>
              <Table.Td>
                <Badge color={statusColor(p.status)} variant="light" radius="sm">
                  {p.status}
                </Badge>
              </Table.Td>
              <Table.Td>{formatDate(p.last_played_at) ?? 'Never'}</Table.Td>
            </Table.Tr>
          ))}
          {pieces.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={5}>
                {!status && !composerId ? (
                  <Center py={48}>
                    <Stack align="center" gap="sm">
                      <Text size="2.5rem" lh={1}>🎹</Text>
                      <Text fw={600} size="lg" c="#1A1612">No pieces yet</Text>
                      <Text c="dimmed" size="sm">Use the <strong>+ Add Piece</strong> button above to get started.</Text>
                    </Stack>
                  </Center>
                ) : (
                  <Text c="dimmed" ta="center" py="xl">No pieces match your filters.</Text>
                )}
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </Stack>
  )
}

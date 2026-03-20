import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Title, Stack, Table, Badge, Text, Breadcrumbs, Anchor,
  Group, SimpleGrid, Card, Box,
} from '@mantine/core'
import { api } from '../api/client'
import type { Composer, Piece } from '../api/types'
import { statusColor, formatDate } from '../utils'

export default function ComposerDetail() {
  const { id } = useParams<{ id: string }>()
  const [composer, setComposer] = useState<Composer | null>(null)
  const [pieces, setPieces] = useState<Piece[]>([])

  useEffect(() => {
    const numId = Number(id)
    api.composers.get(numId).then(setComposer)
    api.pieces.list({ composer_id: numId }).then(setPieces)
  }, [id])

  if (!composer) return <Text>Loading...</Text>

  const years = [composer.born_year, composer.died_year].filter(Boolean)
  const lifespan = years.length === 2 ? `${years[0]} – ${years[1]}` : years[0] ? `b. ${years[0]}` : null

  return (
    <Stack gap="lg">
      <Breadcrumbs fz="sm" c="dimmed">
        <Anchor component={Link} to="/composers" c="dimmed" fz="sm">Composers</Anchor>
        <Text span fz="sm" c="#1A1612">{composer.name}</Text>
      </Breadcrumbs>

      <Group align="flex-end" gap="sm">
        <Title order={1} style={{ fontFamily: 'Playfair Display, serif' }}>{composer.name}</Title>
        {composer.user_id === 0 && (
          <Badge size="sm" color="blue" variant="light" mb={4}>system</Badge>
        )}
      </Group>

      <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="md" maw={480}>
        {composer.nationality && (
          <Box>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={2}>Nationality</Text>
            <Text size="sm">{composer.nationality}</Text>
          </Box>
        )}
        {lifespan && (
          <Box>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={2}>Years</Text>
            <Text size="sm">{lifespan}</Text>
          </Box>
        )}
        <Box>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={2}>Pieces in repertoire</Text>
          <Text size="sm">{pieces.length}</Text>
        </Box>
      </SimpleGrid>

      {pieces.length > 0 && (
        <Box>
          <Title order={2} mb="sm" style={{ fontFamily: 'Playfair Display, serif' }}>Pieces</Title>
          <Table striped highlightOnHover withTableBorder verticalSpacing="sm">
            <Table.Thead style={{ background: '#f9f7f4' }}>
              <Table.Tr>
                <Table.Th>Title</Table.Th>
                <Table.Th>Difficulty</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Last Played</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {pieces.map(p => (
                <Table.Tr key={p.id}>
                  <Table.Td>
                    <Anchor component={Link} to={`/pieces/${p.id}`} c="terracotta" fw={500}>{p.title}</Anchor>
                  </Table.Td>
                  <Table.Td>{p.difficulty}/10</Table.Td>
                  <Table.Td>
                    <Badge color={statusColor(p.status)} variant="light" radius="sm">{p.status}</Badge>
                  </Table.Td>
                  <Table.Td>{formatDate(p.last_played_at) ?? 'Never'}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Box>
      )}

      {pieces.length === 0 && (
        <Text c="dimmed" size="sm">No pieces by this composer in your repertoire yet.</Text>
      )}
    </Stack>
  )
}

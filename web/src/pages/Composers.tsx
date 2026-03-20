import { useEffect, useState } from 'react'
import {
  Title, Group, Button, Table, Badge, Text,
  Checkbox, TextInput, NativeSelect, Stack, Center, Tooltip,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { api } from '../api/client'
import type { Composer } from '../api/types'
import { COMPOSER_NATIONALITIES } from '../api/types'

export default function Composers() {
  const [composers, setComposers] = useState<Composer[]>([])
  const [name, setName] = useState('')
  const [nationality, setNationality] = useState('')
  const [bornYear, setBornYear] = useState('')
  const [diedYear, setDiedYear] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [hideSystem, setHideSystem] = useState(false)

  const load = () => api.composers.list().then(setComposers)

  useEffect(() => { load() }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    await api.composers.create({
      name,
      nationality: nationality as Composer['nationality'],
      born_year: bornYear ? Number(bornYear) : null,
      died_year: diedYear ? Number(diedYear) : null,
    })
    setName('')
    setNationality('')
    setBornYear('')
    setDiedYear('')
    setShowForm(false)
    notifications.show({ message: 'Composer added', color: 'teal' })
    load()
  }

  const visible = composers.filter(c => !hideSystem || c.user_id !== 0)

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <Title order={1} style={{ fontFamily: 'Playfair Display, serif' }}>Composers</Title>
        <Group gap="md" align="center">
          <Checkbox
            label="Hide system composers"
            checked={hideSystem}
            onChange={e => setHideSystem(e.currentTarget.checked)}
          />
          <Button
            variant={showForm ? 'default' : 'filled'}
            onClick={() => setShowForm(v => !v)}
          >
            {showForm ? 'Cancel' : '+ Add Composer'}
          </Button>
        </Group>
      </Group>

      {showForm && (
        <form onSubmit={submit}>
          <Group gap="sm" wrap="wrap" align="flex-end">
            <TextInput
              required
              placeholder="Name"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{ flex: 2, minWidth: 160 }}
            />
            <NativeSelect
              value={nationality}
              onChange={e => setNationality(e.target.value)}
              data={[
                { value: '', label: 'Nationality' },
                ...COMPOSER_NATIONALITIES.map(n => ({ value: n, label: n })),
              ]}
              style={{ minWidth: 160 }}
            />
            <TextInput
              placeholder="Born year"
              type="number"
              value={bornYear}
              onChange={e => setBornYear(e.target.value)}
              w={120}
            />
            <TextInput
              placeholder="Died year"
              type="number"
              value={diedYear}
              onChange={e => setDiedYear(e.target.value)}
              w={120}
            />
            <Button type="submit">Add</Button>
          </Group>
        </form>
      )}

      <Table striped highlightOnHover withTableBorder verticalSpacing="sm">
        <Table.Thead style={{ background: '#f9f7f4' }}>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Nationality</Table.Th>
            <Table.Th>Born</Table.Th>
            <Table.Th>Died</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {visible.map(c => (
            <Table.Tr key={c.id}>
              <Table.Td>
                <Group gap="xs">
                  {c.name}
                  {c.user_id === 0 && (
                    <Tooltip label="Built-in composer, shared across all users" withArrow>
                      <Badge size="xs" color="blue" variant="light">system</Badge>
                    </Tooltip>
                  )}
                </Group>
              </Table.Td>
              <Table.Td c="dimmed">{c.nationality || '—'}</Table.Td>
              <Table.Td c="dimmed">{c.born_year ?? '—'}</Table.Td>
              <Table.Td c="dimmed">{c.died_year ?? '—'}</Table.Td>
              <Table.Td ta="right">
                {c.user_id !== 0 && (
                  <Button
                    size="xs"
                    variant="subtle"
                    color="red"
                    onClick={async () => { await api.composers.delete(c.id); load() }}
                  >
                    Delete
                  </Button>
                )}
              </Table.Td>
            </Table.Tr>
          ))}
          {visible.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={5}>
                <Center py="xl">
                  <Text c="dimmed">No composers yet.</Text>
                </Center>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </Stack>
  )
}

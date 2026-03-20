import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Title, Stack, TextInput, NativeSelect,
  Button, Group, Paper, Slider, Text,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { api } from '../api/client'
import type { Composer, Piece } from '../api/types'

export default function PieceForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = id !== undefined
  const navigate = useNavigate()

  const [composers, setComposers] = useState<Composer[]>([])
  const [title, setTitle] = useState('')
  const [composerId, setComposerId] = useState('')
  const [difficulty, setDifficulty] = useState(5)
  const [status, setStatus] = useState('wishlist')
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString().slice(0, 10))

  useEffect(() => {
    api.composers.list().then(setComposers)
    if (isEdit) {
      api.pieces.get(Number(id)).then(p => {
        setTitle(p.title)
        setComposerId(String(p.composer_id))
        setDifficulty(p.difficulty ?? 5)
        setStatus(p.status)
        setStartedAt(p.started_at ? p.started_at.slice(0, 10) : '')
      })
    }
  }, [id])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      title,
      composer_id: Number(composerId),
      difficulty,
      status: status as Piece['status'],
      started_at: startedAt ? new Date(startedAt).toISOString() : null,
    }
    if (isEdit) {
      await api.pieces.update(Number(id), data)
      notifications.show({ message: 'Piece updated', color: 'teal' })
      navigate(`/pieces/${id}`)
    } else {
      const p = await api.pieces.create(data)
      notifications.show({ message: 'Piece added to repertoire', color: 'teal' })
      navigate(`/pieces/${p.id}`)
    }
  }

  const composerOptions = [
    { value: '', label: 'Select a composer' },
    ...composers.map(c => ({ value: String(c.id), label: c.name })),
  ]

  return (
    <Paper maw={520} mx="auto" p="xl" withBorder radius="md">
      <Title order={1} mb="lg" style={{ fontFamily: 'Playfair Display, serif' }}>
        {isEdit ? 'Edit Piece' : 'Add Piece'}
      </Title>
      <form onSubmit={submit}>
        <Stack gap="md">
          <TextInput
            label="Title"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <NativeSelect
            label="Composer"
            required
            value={composerId}
            onChange={e => setComposerId(e.target.value)}
            data={composerOptions}
          />
          <div>
            <Text size="sm" fw={500} mb={6}>Difficulty — {difficulty}/10</Text>
            <Slider
              aria-label="Difficulty (1–10)"
              min={1}
              max={10}
              value={difficulty}
              onChange={setDifficulty}
              marks={[1,3,5,7,10].map(v => ({ value: v, label: String(v) }))}
              color="terracotta"
              mb="md"
            />
          </div>
          <NativeSelect
            label="Status"
            value={status}
            onChange={e => setStatus(e.target.value)}
            data={[
              { value: 'wishlist', label: 'Wishlist' },
              { value: 'learning', label: 'Learning' },
              { value: 'active',   label: 'Active'   },
              { value: 'shelved',  label: 'Shelved'  },
            ]}
          />
          <TextInput
            label="Started At"
            type="date"
            value={startedAt}
            onChange={e => setStartedAt(e.target.value)}
          />
          <Group mt="xs">
            <Button type="submit" flex={1}>
              {isEdit ? 'Save Changes' : 'Add Piece'}
            </Button>
            <Button type="button" variant="default" flex={1} onClick={() => navigate(-1)}>
              Cancel
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  )
}

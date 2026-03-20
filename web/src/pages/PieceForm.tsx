import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Title, Stack, TextInput, NativeSelect, Textarea,
  Button, Group, Paper, Slider, Text, Modal, ActionIcon, Tooltip,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { DatePickerInput } from '@mantine/dates'
import { api } from '../api/client'
import type { Composer, Piece } from '../api/types'
import { COMPOSER_NATIONALITIES } from '../api/types'

export default function PieceForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = id !== undefined
  const navigate = useNavigate()

  const [composers, setComposers] = useState<Composer[]>([])
  const [title, setTitle] = useState('')
  const [composerId, setComposerId] = useState('')
  const [difficulty, setDifficulty] = useState(5)
  const [status, setStatus] = useState('wishlist')
  const [startedAt, setStartedAt] = useState<Date | null>(() => new Date())
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<{ title?: string; composer?: string }>({})

  // Quick-add composer modal
  const [composerModalOpened, { open: openComposerModal, close: closeComposerModal }] = useDisclosure(false)
  const [newComposerName, setNewComposerName] = useState('')
  const [newComposerNationality, setNewComposerNationality] = useState('')

  const loadComposers = () => api.composers.list().then(setComposers)

  useEffect(() => {
    loadComposers()
    if (isEdit) {
      api.pieces.get(Number(id)).then(p => {
        setTitle(p.title)
        setComposerId(String(p.composer_id))
        setDifficulty(p.difficulty ?? 5)
        setStatus(p.status)
        setStartedAt(p.started_at ? new Date(p.started_at) : null)
        setNotes(p.notes ?? '')
      })
    }
  }, [id])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: typeof errors = {}
    if (!title.trim()) errs.title = 'Title is required'
    if (!composerId) errs.composer = 'Please select a composer'
    if (Object.keys(errs).length) { setErrors(errs); return }

    const data = {
      title,
      composer_id: Number(composerId),
      difficulty,
      status: status as Piece['status'],
      started_at: startedAt ? startedAt.toISOString() : null,
      notes,
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

  const addComposer = async () => {
    if (!newComposerName.trim()) return
    const c = await api.composers.create({
      name: newComposerName.trim(),
      nationality: newComposerNationality as Composer['nationality'],
    })
    notifications.show({ message: `${c.name} added`, color: 'teal' })
    await loadComposers()
    setComposerId(String(c.id))
    setErrors(v => ({ ...v, composer: undefined }))
    setNewComposerName('')
    setNewComposerNationality('')
    closeComposerModal()
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
            onChange={e => { setTitle(e.target.value); setErrors(v => ({ ...v, title: undefined })) }}
            error={errors.title}
          />
          <div>
            <Group gap="xs" align="flex-end">
              <NativeSelect
                label="Composer"
                required
                value={composerId}
                onChange={e => { setComposerId(e.target.value); setErrors(v => ({ ...v, composer: undefined })) }}
                data={composerOptions}
                error={errors.composer}
                style={{ flex: 1 }}
              />
              <Tooltip label="Add a new composer" withArrow>
                <ActionIcon
                  variant="default"
                  size="lg"
                  mb={errors.composer ? 20 : 0}
                  onClick={openComposerModal}
                  aria-label="Add new"
                >
                  +
                </ActionIcon>
              </Tooltip>
            </Group>
          </div>
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
          <Textarea
            label="Notes"
            placeholder="e.g. currently working on bars 24–48, focus on left hand"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            autosize
            minRows={2}
          />
          <DatePickerInput
            label="Started At"
            placeholder="Pick a date"
            value={startedAt}
            onChange={setStartedAt}
            clearable
            valueFormat="MMM D, YYYY"
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

      {/* Quick-add composer modal */}
      <Modal
        opened={composerModalOpened}
        onClose={closeComposerModal}
        title="Add Composer"
        centered
        size="sm"
      >
        <Stack gap="md">
          <TextInput
            label="Name"
            required
            placeholder="e.g. Johann Sebastian Bach"
            value={newComposerName}
            onChange={e => setNewComposerName(e.target.value)}
          />
          <NativeSelect
            label="Nationality"
            value={newComposerNationality}
            onChange={e => setNewComposerNationality(e.target.value)}
            data={[
              { value: '', label: 'Select nationality (optional)' },
              ...COMPOSER_NATIONALITIES.map(n => ({ value: n, label: n })),
            ]}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeComposerModal}>Cancel</Button>
            <Button onClick={addComposer} disabled={!newComposerName.trim()}>Add Composer</Button>
          </Group>
        </Stack>
      </Modal>
    </Paper>
  )
}

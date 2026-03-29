import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Title, Stack, TextInput, NativeSelect, Textarea,
  Button, Group, Paper, Slider, Text, Modal, ActionIcon, Tooltip,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { DatePickerInput } from '@mantine/dates'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'
import type { Composer, Piece } from '../api/types'
import { COMPOSER_NATIONALITIES } from '../api/types'

export default function PieceForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = id !== undefined
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [composers, setComposers] = useState<Composer[]>([])
  const [title, setTitle] = useState('')
  const [composerId, setComposerId] = useState('')
  const [difficulty, setDifficulty] = useState(5)
  const [difficultyInput, setDifficultyInput] = useState('5')
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
        setDifficultyInput(String(p.difficulty ?? 5))
        setStatus(p.status)
        setStartedAt(p.started_at ? new Date(p.started_at) : null)
        setNotes(p.notes ?? '')
      })
    }
  }, [id])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: typeof errors = {}
    if (!title.trim()) errs.title = t('pieceForm.errorTitle')
    if (!composerId) errs.composer = t('pieceForm.errorComposer')
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
      notifications.show({ message: t('pieceForm.notifUpdated'), color: 'teal' })
      navigate(`/pieces/${id}`)
    } else {
      const p = await api.pieces.create(data)
      notifications.show({ message: t('pieceForm.notifAdded'), color: 'teal' })
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
    { value: '', label: t('pieceForm.selectComposer') },
    ...composers.map(c => ({ value: String(c.id), label: c.name })),
  ]

  return (
    <Paper maw={520} mx="auto" p="xl" withBorder radius="md">
      <Title order={1} mb="lg" style={{ fontFamily: 'Playfair Display, serif' }}>
        {isEdit ? t('pieceForm.editTitle') : t('pieceForm.addTitle')}
      </Title>
      <form onSubmit={submit}>
        <Stack gap="md">
          <TextInput
            label={t('pieceForm.labelTitle')}
            required
            value={title}
            onChange={e => { setTitle(e.target.value); setErrors(v => ({ ...v, title: undefined })) }}
            error={errors.title}
          />
          <div>
            <Group gap="xs" align="flex-end">
              <NativeSelect
                label={t('pieceForm.labelComposer')}
                required
                value={composerId}
                onChange={e => { setComposerId(e.target.value); setErrors(v => ({ ...v, composer: undefined })) }}
                data={composerOptions}
                error={errors.composer}
                style={{ flex: 1 }}
              />
              <Tooltip label={t('pieceForm.addNewComposerTooltip')} withArrow>
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
            <Group gap="xs" align="center" mb={6}>
              <Text size="sm" fw={500}>{t('pieceForm.labelDifficulty', { value: difficulty })}</Text>
              <TextInput
                type="number"
                value={difficultyInput}
                onChange={e => {
                  setDifficultyInput(e.target.value)
                  const v = parseInt(e.target.value)
                  if (!isNaN(v) && v >= 1 && v <= 10) setDifficulty(v)
                }}
                w={60}
                size="xs"
                min={1}
                max={10}
              />
            </Group>
            <Slider
              aria-label="Difficulty (1–10)"
              min={1}
              max={10}
              value={difficulty}
              onChange={v => { setDifficulty(v); setDifficultyInput(String(v)) }}
              marks={[1,3,5,7,10].map(v => ({ value: v, label: String(v) }))}
              color="dark"
              mb="md"
            />
          </div>
          <NativeSelect
            label={t('pieceForm.labelStatus')}
            value={status}
            onChange={e => setStatus(e.target.value)}
            data={[
              { value: 'wishlist', label: t('status.wishlist') },
              { value: 'learning', label: t('status.learning') },
              { value: 'active',   label: t('status.active')   },
              { value: 'shelved',  label: t('status.shelved')  },
            ]}
          />
          <Textarea
            label={t('pieceForm.labelNotes')}
            placeholder={t('pieceForm.notesPlaceholder')}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            autosize
            minRows={2}
          />
          <DatePickerInput
            label={t('pieceForm.labelStartedAt')}
            placeholder={t('pieceForm.datePlaceholder')}
            value={startedAt}
            onChange={v => setStartedAt(v as Date | null)}
            clearable
            valueFormat="MMM D, YYYY"
          />
          <Group mt="xs">
            <Button type="submit" flex={1}>
              {isEdit ? t('pieceForm.saveChanges') : t('pieceForm.addPiece')}
            </Button>
            <Button type="button" variant="default" flex={1} onClick={() => navigate(-1)}>
              {t('pieceForm.cancel')}
            </Button>
          </Group>
        </Stack>
      </form>

      {/* Quick-add composer modal */}
      <Modal
        opened={composerModalOpened}
        onClose={closeComposerModal}
        title={t('pieceForm.composerModal.title')}
        centered
        size="sm"
      >
        <Stack gap="md">
          <TextInput
            label={t('pieceForm.composerModal.labelName')}
            required
            placeholder={t('pieceForm.composerModal.namePlaceholder')}
            value={newComposerName}
            onChange={e => setNewComposerName(e.target.value)}
          />
          <NativeSelect
            label={t('pieceForm.composerModal.labelNationality')}
            value={newComposerNationality}
            onChange={e => setNewComposerNationality(e.target.value)}
            data={[
              { value: '', label: t('pieceForm.composerModal.nationalityPlaceholder') },
              ...COMPOSER_NATIONALITIES.map(n => ({ value: n, label: n })),
            ]}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeComposerModal}>{t('pieceForm.composerModal.cancel')}</Button>
            <Button onClick={addComposer} disabled={!newComposerName.trim()}>{t('pieceForm.composerModal.add')}</Button>
          </Group>
        </Stack>
      </Modal>
    </Paper>
  )
}

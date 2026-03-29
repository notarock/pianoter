import { useEffect, useMemo, useState } from 'react'
import {
  Title, Group, Button, Badge, Text,
  Checkbox, TextInput, NativeSelect, Stack, Tooltip,
} from '@mantine/core'
import { DataTable, type DataTableSortStatus } from 'mantine-datatable'
import { notifications } from '@mantine/notifications'
import { useTranslation } from 'react-i18next'
import { api } from '../api/client'
import type { Composer } from '../api/types'
import { COMPOSER_NATIONALITIES } from '../api/types'

export default function Composers() {
  const { t } = useTranslation()
  const [composers, setComposers] = useState<Composer[]>([])
  const [name, setName] = useState('')
  const [nationality, setNationality] = useState('')
  const [bornYear, setBornYear] = useState('')
  const [diedYear, setDiedYear] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [hideSystem, setHideSystem] = useState(false)
  const [search, setSearch] = useState('')
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<Composer>>({
    columnAccessor: 'name',
    direction: 'asc',
  })

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
    notifications.show({ message: t('composers.notifAdded'), color: 'teal' })
    load()
  }

  const filtered = useMemo(() =>
    composers.filter(c =>
      (!hideSystem || c.user_id !== 0) &&
      (!search || c.name.toLowerCase().includes(search.toLowerCase()))
    ),
    [composers, hideSystem, search])

  const sorted = useMemo(() => {
    const { columnAccessor, direction } = sortStatus
    return [...filtered].sort((a, b) => {
      const av = a[columnAccessor as keyof Composer] ?? ''
      const bv = b[columnAccessor as keyof Composer] ?? ''
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv))
      return direction === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortStatus])

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <Title order={1} style={{ fontFamily: 'Playfair Display, serif' }}>{t('composers.title')}</Title>
        <Group gap="md" align="center">
          <TextInput
            placeholder={t('composers.searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            w={200}
          />
          <Checkbox
            label={t('composers.hideSystem')}
            checked={hideSystem}
            onChange={e => setHideSystem(e.currentTarget.checked)}
          />
          <Button
            variant={showForm ? 'default' : 'filled'}
            onClick={() => setShowForm(v => !v)}
          >
            {showForm ? t('composers.cancel') : t('composers.addComposer')}
          </Button>
        </Group>
      </Group>

      {showForm && (
        <form onSubmit={submit}>
          <Group gap="sm" wrap="wrap" align="flex-end">
            <TextInput
              required
              placeholder={t('composers.namePlaceholder')}
              value={name}
              onChange={e => setName(e.target.value)}
              style={{ flex: 2, minWidth: 160 }}
            />
            <NativeSelect
              value={nationality}
              onChange={e => setNationality(e.target.value)}
              data={[
                { value: '', label: t('composers.nationalityLabel') },
                ...COMPOSER_NATIONALITIES.map(n => ({ value: n, label: n })),
              ]}
              style={{ minWidth: 160 }}
            />
            <TextInput
              placeholder={t('composers.bornPlaceholder')}
              type="number"
              value={bornYear}
              onChange={e => setBornYear(e.target.value)}
              w={120}
            />
            <TextInput
              placeholder={t('composers.diedPlaceholder')}
              type="number"
              value={diedYear}
              onChange={e => setDiedYear(e.target.value)}
              w={120}
            />
            <Button type="submit">{t('composers.add')}</Button>
          </Group>
        </form>
      )}

      <DataTable
        striped
        highlightOnHover
        withTableBorder
        verticalSpacing="sm"
        records={sorted}
        sortStatus={sortStatus}
        onSortStatusChange={setSortStatus}
        noRecordsText={t('composers.noComposers')}
        columns={[
          {
            accessor: 'name',
            title: t('composers.colName'),
            sortable: true,
            render: c => (
              <Group gap="xs">
                {c.name}
                {c.user_id === 0 && (
                  <Tooltip label={t('composers.systemTooltip')} withArrow>
                    <Badge size="xs" color="gray" variant="light">{t('composers.systemBadge')}</Badge>
                  </Tooltip>
                )}
              </Group>
            ),
          },
          {
            accessor: 'nationality',
            title: t('composers.colNationality'),
            sortable: true,
            render: c => <Text c="dimmed" size="sm">{c.nationality || '—'}</Text>,
          },
          {
            accessor: 'born_year',
            title: t('composers.colBorn'),
            sortable: true,
            render: c => <Text c="dimmed" size="sm">{c.born_year ?? '—'}</Text>,
          },
          {
            accessor: 'died_year',
            title: t('composers.colDied'),
            sortable: true,
            render: c => <Text c="dimmed" size="sm">{c.died_year ?? '—'}</Text>,
          },
          {
            accessor: 'actions',
            title: '',
            textAlign: 'right',
            render: c => c.user_id !== 0 ? (
              <Button
                size="xs"
                variant="subtle"
                color="red"
                onClick={async () => { await api.composers.delete(c.id); load() }}
              >
                {t('composers.deleteBtn')}
              </Button>
            ) : null,
          },
        ]}
      />
    </Stack>
  )
}

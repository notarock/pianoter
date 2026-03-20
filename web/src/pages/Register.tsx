import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Paper, Title, TextInput, PasswordInput, Button, Text, Anchor, Stack, Alert } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import { authApi } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError(t('register.errorNoMatch'))
      return
    }
    setLoading(true)
    try {
      const res = await authApi.register(username, password)
      login(res.token, res.user)
      navigate('/')
    } catch {
      setError(t('register.errorFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Paper
      w={400}
      mx="auto"
      mt={80}
      p="xl"
      radius="lg"
      shadow="sm"
      style={{ border: '1px solid var(--app-border)' }}
    >
      <Title order={2} ta="center" mb="xl" style={{ fontFamily: 'Playfair Display, serif' }}>
        {t('register.title')}
      </Title>

      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label={t('register.labelUsername')}
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            autoFocus
          />
          <PasswordInput
            label={t('register.labelPassword')}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <PasswordInput
            label={t('register.labelConfirm')}
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
          />
          {error && (
            <Alert color="red" variant="light" radius="md">
              {error}
            </Alert>
          )}
          <Button type="submit" fullWidth loading={loading} mt="xs">
            {t('register.submitBtn')}
          </Button>
        </Stack>
      </form>

      <Text ta="center" mt="md" size="sm" c="dimmed">
        {t('register.haveAccount')}{' '}
        <Anchor component={Link} to="/login" c="terracotta">
          {t('register.signInLink')}
        </Anchor>
      </Text>
    </Paper>
  )
}

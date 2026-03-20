import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Paper, Title, TextInput, PasswordInput, Button, Text, Anchor, Stack, Alert } from '@mantine/core'
import { authApi } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.login(username, password)
      login(res.token, res.user)
      navigate('/')
    } catch {
      setError('Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Paper
      w={420}
      mx="auto"
      mt={80}
      p="xl"
      radius="lg"
      shadow="sm"
      style={{ border: '1px solid var(--app-border)' }}
    >
      <Title order={2} ta="center" mb="xl" style={{ fontFamily: 'Playfair Display, serif' }}>
        Sign in to Pianoter
      </Title>

      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            autoFocus
          />
          <PasswordInput
            label="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {error && (
            <Alert color="red" variant="light" radius="md">
              {error}
            </Alert>
          )}
          <Button type="submit" fullWidth loading={loading} mt="xs">
            Sign in
          </Button>
        </Stack>
      </form>

      <Text ta="center" mt="md" size="sm" c="dimmed">
        No account?{' '}
        <Anchor component={Link} to="/register" c="terracotta">
          Register
        </Anchor>
      </Text>
    </Paper>
  )
}

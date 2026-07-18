import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Container } from '@royal-spirits/ui';
import { useAuth } from '../lib/auth';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-rs-surface">
      <Container className="max-w-sm">
        <div className="rounded-rs-lg border border-rs-outline-variant bg-rs-surface-lowest p-8 shadow-ambient">
          <h1 className="font-display text-2xl font-bold text-rs-on-surface">Royal Spirits</h1>
          <p className="mt-1 text-sm text-rs-on-surface-variant">Admin sign in</p>
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <Input
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            {error && <p className="text-sm text-rs-error">{error}</p>}
            <Button type="submit" fullWidth disabled={submitting}>
              {submitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </div>
      </Container>
    </div>
  );
}

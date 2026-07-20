import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
          <div className="mt-6 flex flex-col items-center gap-2 text-xs">
            <Link to="/forgot-password" className="text-rs-secondary hover:underline">
              Forgot password?
            </Link>
            <p className="text-rs-on-surface-variant">
              Don't have an admin account?{' '}
              <Link to="/register" className="text-rs-secondary font-semibold hover:underline">
                Register
              </Link>
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}

'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Container, Button, Input } from '@royal-spirits/ui';
import { useCustomerAuth } from '../../lib/auth';

function LoginForm() {
  const { login } = useCustomerAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      router.push(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-rs-lg border border-rs-outline-variant bg-rs-surface-lowest p-8 shadow-ambient">
      <h1 className="font-display text-3xl font-bold text-rs-on-surface">Sign In</h1>
      <p className="mt-1 text-sm text-rs-on-surface-variant">
        Sign in to your customer account
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="email@example.com"
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="Enter your password"
        />

        {error && <p className="text-sm text-rs-error">{error}</p>}

        <Button type="submit" fullWidth disabled={submitting} className="mt-2">
          {submitting ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <div className="mt-6 flex flex-col items-center gap-2 text-xs">
        <Link
          href={`/forgot-password?redirect=${encodeURIComponent(redirect)}`}
          className="text-rs-secondary hover:underline"
        >
          Forgot your password?
        </Link>
        <p className="text-rs-on-surface-variant">
          Don't have an account?{' '}
          <Link
            href={`/register?redirect=${encodeURIComponent(redirect)}`}
            className="text-rs-secondary font-semibold hover:underline"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-10">
      <Suspense fallback={<p className="text-rs-on-surface-variant">Loading...</p>}>
        <LoginForm />
      </Suspense>
    </Container>
  );
}

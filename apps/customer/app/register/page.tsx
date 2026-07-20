'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Container, Button, Input } from '@royal-spirits/ui';
import { useCustomerAuth } from '../../lib/auth';

function RegisterForm() {
  const { signup } = useCustomerAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name || !phone || !email || !password) {
      setError('All fields are required.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Please enter a valid 10-digit Indian phone number.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await signup(email, password, phone, name);
      router.push(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-rs-lg border border-rs-outline-variant bg-rs-surface-lowest p-8 shadow-ambient">
      <h1 className="font-display text-3xl font-bold text-rs-on-surface">Create Account</h1>
      <p className="mt-1 text-sm text-rs-on-surface-variant">
        Register a new customer account
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Input
          label="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="John Doe"
        />

        <Input
          label="Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          placeholder="10-digit Indian mobile number"
          maxLength={10}
        />

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
          placeholder="At least 6 characters"
        />

        {error && <p className="text-sm text-rs-error">{error}</p>}

        <Button type="submit" fullWidth disabled={submitting} className="mt-2">
          {submitting ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>

      <div className="mt-6 text-center text-xs text-rs-on-surface-variant">
        Already have an account?{' '}
        <Link
          href={`/login?redirect=${encodeURIComponent(redirect)}`}
          className="text-rs-secondary font-semibold hover:underline"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Container className="flex min-h-[80vh] items-center justify-center py-10">
      <Suspense fallback={<p className="text-rs-on-surface-variant">Loading...</p>}>
        <RegisterForm />
      </Suspense>
    </Container>
  );
}

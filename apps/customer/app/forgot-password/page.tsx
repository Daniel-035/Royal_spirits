'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Container, Button, Input } from '@royal-spirits/ui';
import { api } from '../../lib/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/auth/customer/forgot-password', { email });
      setMessage('A reset code has been sent (check server logs).');
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!token || !newPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/auth/customer/reset-password', { email, token, newPassword });
      setMessage('Password reset successful! Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid or expired reset code');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-10">
      <div className="w-full max-w-md rounded-rs-lg border border-rs-outline-variant bg-rs-surface-lowest p-8 shadow-ambient">
        <h1 className="font-display text-3xl font-bold text-rs-on-surface">Reset Password</h1>
        <p className="mt-1 text-sm text-rs-on-surface-variant">
          {step === 1 ? 'Request a password reset code' : 'Enter your reset code and new password'}
        </p>

        {step === 1 ? (
          <form onSubmit={handleSendCode} className="mt-6 space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="email@example.com"
            />

            {error && <p className="text-sm text-rs-error">{error}</p>}
            {message && <p className="text-sm text-rs-secondary">{message}</p>}

            <Button type="submit" fullWidth disabled={submitting}>
              {submitting ? 'Sending...' : 'Send Reset Code'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="mt-6 space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              disabled
            />

            <Input
              label="6-Digit Reset Code"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
              placeholder="123456"
            />

            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="At least 6 characters"
            />

            {error && <p className="text-sm text-rs-error">{error}</p>}
            {message && <p className="text-sm text-rs-secondary">{message}</p>}

            <Button type="submit" fullWidth disabled={submitting}>
              {submitting ? 'Resetting...' : 'Reset Password'}
            </Button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-center text-xs text-rs-on-surface-variant hover:underline"
            >
              Back to Step 1
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-xs text-rs-on-surface-variant">
          Back to{' '}
          <Link href="/login" className="text-rs-secondary font-semibold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </Container>
  );
}

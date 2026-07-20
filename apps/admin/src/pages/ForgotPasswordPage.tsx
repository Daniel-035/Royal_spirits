import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Input, Container } from '@royal-spirits/ui';
import { api } from '../lib/api';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!username) {
      setError('Please enter your username.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/auth/admin/forgot-password', { username });
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
      await api.post('/auth/admin/reset-password', { username, token, newPassword });
      setMessage('Password reset successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid or expired reset code');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-rs-surface">
      <Container className="max-w-sm">
        <div className="rounded-rs-lg border border-rs-outline-variant bg-rs-surface-lowest p-8 shadow-ambient">
          <h1 className="font-display text-2xl font-bold text-rs-on-surface">Royal Spirits</h1>
          <p className="mt-1 text-sm text-rs-on-surface-variant">
            {step === 1 ? 'Admin Password Recovery' : 'Reset Admin Password'}
          </p>

          {step === 1 ? (
            <form onSubmit={handleSendCode} className="mt-6 flex flex-col gap-4">
              <Input
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Enter username"
              />

              {error && <p className="text-sm text-rs-error">{error}</p>}
              {message && <p className="text-sm text-rs-secondary">{message}</p>}

              <Button type="submit" fullWidth disabled={submitting}>
                {submitting ? 'Sending...' : 'Send Reset Code'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="mt-6 flex flex-col gap-4">
              <Input
                label="Username"
                value={username}
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
                className="w-full text-center text-xs text-rs-on-surface-variant hover:underline mt-2"
              >
                Back to Step 1
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-xs text-rs-on-surface-variant">
            Back to{' '}
            <Link to="/login" className="text-rs-secondary font-semibold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}

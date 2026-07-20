import { useState } from 'react';
import { Button, Input, Container } from '@royal-spirits/ui';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';

export function ProfilePage() {
  const { admin } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword) {
      setError('Please fill in both fields.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    setBusy(true);
    try {
      await api.put('/auth/admin/profile', { currentPassword, newPassword });
      setSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password update failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Container className="py-8 max-w-xl">
      <h1 className="font-display text-3xl font-bold text-rs-on-surface">Admin Profile</h1>
      <p className="mt-1 text-sm text-rs-on-surface-variant">
        Manage your administrator profile details.
      </p>

      <div className="mt-8 rounded-rs-lg border border-rs-outline-variant bg-rs-surface-lowest p-6 shadow-ambient">
        <h2 className="font-display text-lg font-semibold text-rs-on-surface">
          Security Credentials
        </h2>
        
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <Input
            label="Username"
            value={admin?.username ?? ''}
            disabled
          />

          <Input
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            placeholder="Enter current password"
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
          {success && <p className="text-sm text-rs-secondary">{success}</p>}

          <Button type="submit" disabled={busy}>
            {busy ? 'Updating...' : 'Change Password'}
          </Button>
        </form>
      </div>
    </Container>
  );
}

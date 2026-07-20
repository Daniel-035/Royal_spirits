import { useState, useEffect } from 'react';
import { Button, Input, Container } from '@royal-spirits/ui';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import type { Admin } from '@royal-spirits/shared';

export function ProfilePage() {
  const { admin, updateAdmin } = useAuth();
  const [businessName, setBusinessName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (admin) {
      setBusinessName(admin.businessName || '');
      setLicenseNumber(admin.licenseNumber || '');
      setShopAddress(admin.shopAddress || '');
      setPhone(admin.phone || '');
    }
  }, [admin]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!businessName || !licenseNumber || !shopAddress || !phone) {
      setError('Business details are required.');
      return;
    }

    if (newPassword && !currentPassword) {
      setError('Please enter your current password to update your password.');
      return;
    }

    setBusy(true);
    try {
      const updated = await api.put<Admin>('/auth/admin/profile', {
        businessName,
        licenseNumber,
        shopAddress,
        phone,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });
      updateAdmin(updated);
      setSuccess('Profile updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Profile update failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Container className="py-8 max-w-2xl">
      <h1 className="font-display text-3xl font-bold text-rs-on-surface">Admin Profile</h1>
      <p className="mt-1 text-sm text-rs-on-surface-variant">
        Manage your administrator and shop/business details.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {/* Business Details Section */}
        <div className="rounded-rs-lg border border-rs-outline-variant bg-rs-surface-lowest p-6 shadow-ambient">
          <h2 className="font-display text-lg font-semibold text-rs-on-surface border-b border-rs-outline-variant pb-2">
            Business & Shop Details
          </h2>
          
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input
              label="Username"
              value={admin?.username ?? ''}
              disabled
            />
            <Input
              label="Business / Shop Name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
              placeholder="e.g. Royal Spirits Central"
            />
            <Input
              label="Excise License Number"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              required
              placeholder="e.g. L-EXCISE-12345"
            />
            <Input
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="Shop phone number"
            />
            <div className="sm:col-span-2">
              <Input
                label="Shop Address"
                value={shopAddress}
                onChange={(e) => setShopAddress(e.target.value)}
                required
                placeholder="Full shop address"
              />
            </div>
          </div>
        </div>

        {/* Password Update Section */}
        <div className="rounded-rs-lg border border-rs-outline-variant bg-rs-surface-lowest p-6 shadow-ambient">
          <h2 className="font-display text-lg font-semibold text-rs-on-surface border-b border-rs-outline-variant pb-2">
            Security Credentials (Optional)
          </h2>
          <p className="mt-1 text-xs text-rs-on-surface-variant">
            Leave these fields blank if you do not wish to change your password.
          </p>
          
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </div>
        </div>

        {error && <p className="text-sm text-rs-error">{error}</p>}
        {success && <p className="text-sm text-rs-secondary">{success}</p>}

        <div className="flex justify-end">
          <Button type="submit" disabled={busy}>
            {busy ? 'Saving Changes...' : 'Save Profile'}
          </Button>
        </div>
      </form>
    </Container>
  );
}

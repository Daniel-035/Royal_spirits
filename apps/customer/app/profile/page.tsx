'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Button, Input } from '@royal-spirits/ui';
import { useCustomerAuth } from '../../lib/auth';
import { api } from '../../lib/api';
import type { CustomerAddress } from '@royal-spirits/shared';

export default function ProfilePage() {
  const router = useRouter();
  const { customer, loading: authLoading } = useCustomerAuth();

  // Profile fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Address fields
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [addressLine, setAddressLine] = useState('');
  const [pincode, setPincode] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  // States
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileBusy, setProfileBusy] = useState(false);

  const [addressSuccess, setAddressSuccess] = useState('');
  const [addressError, setAddressError] = useState('');
  const [addressBusy, setAddressBusy] = useState(false);
  const [addressLoading, setAddressLoading] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !customer) {
      router.push('/login?redirect=/profile');
    }
  }, [customer, authLoading, router]);

  // Sync profile fields when customer loaded
  useEffect(() => {
    if (customer) {
      setName(customer.name ?? '');
      setEmail(customer.email ?? '');
      setPhone(customer.phone ?? '');
    }
  }, [customer]);

  // Load addresses
  useEffect(() => {
    if (customer) {
      fetchAddresses();
    }
  }, [customer]);

  async function fetchAddresses() {
    setAddressLoading(true);
    try {
      const data = await api.get<CustomerAddress[]>('/auth/customer/addresses');
      setAddresses(data);
    } catch {
      // Ignore
    } finally {
      setAddressLoading(false);
    }
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setProfileBusy(true);

    try {
      await api.put('/auth/customer/profile', {
        name,
        email,
        phone,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });
      setProfileSuccess('Profile updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setProfileBusy(false);
    }
  }

  async function handleAddAddress(e: React.FormEvent) {
    e.preventDefault();
    setAddressError('');
    setAddressSuccess('');

    if (!addressLine || !/^\d{6}$/.test(pincode)) {
      setAddressError('Please enter a valid address and 6-digit pincode.');
      return;
    }

    setAddressBusy(true);
    try {
      await api.post('/auth/customer/addresses', {
        addressLine,
        pincode,
        isDefault,
      });
      setAddressSuccess('Address added successfully!');
      setAddressLine('');
      setPincode('');
      setIsDefault(false);
      fetchAddresses();
    } catch (err) {
      setAddressError(err instanceof Error ? err.message : 'Failed to add address');
    } finally {
      setAddressBusy(false);
    }
  }

  async function handleDeleteAddress(id: string) {
    setAddressError('');
    setAddressSuccess('');
    try {
      await api.delete(`/auth/customer/addresses/${id}`);
      setAddressSuccess('Address deleted successfully!');
      fetchAddresses();
    } catch (err) {
      setAddressError(err instanceof Error ? err.message : 'Failed to delete address');
    }
  }

  if (authLoading || !customer) {
    return (
      <Container className="py-10">
        <p className="text-rs-on-surface-variant">Loading...</p>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <h1 className="font-display text-3xl font-bold text-rs-on-surface">My Account</h1>
      <p className="mt-1 text-sm text-rs-on-surface-variant">
        Manage your profile, login details, and shipping address book.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Profile management */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-rs-lg border border-rs-outline-variant bg-rs-surface-lowest p-6 shadow-ambient">
            <h2 className="font-display text-xl font-semibold text-rs-on-surface">
              Account Details
            </h2>
            <form onSubmit={handleUpdateProfile} className="mt-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <Input
                  label="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  maxLength={10}
                />
              </div>

              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <hr className="border-rs-outline-variant my-4" />

              <h3 className="font-display text-sm font-semibold text-rs-on-surface">
                Change Password (Optional)
              </h3>
              <p className="text-xs text-rs-on-surface-variant">
                Leave blank if you do not wish to change your password.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
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

              {profileError && <p className="text-sm text-rs-error">{profileError}</p>}
              {profileSuccess && <p className="text-sm text-rs-secondary">{profileSuccess}</p>}

              <Button type="submit" disabled={profileBusy}>
                {profileBusy ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </div>
        </div>

        {/* Address book */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-rs-lg border border-rs-outline-variant bg-rs-surface-lowest p-6 shadow-ambient">
            <h2 className="font-display text-xl font-semibold text-rs-on-surface">
              Address Book
            </h2>

            {/* List addresses */}
            <div className="mt-4 space-y-3">
              {addressLoading ? (
                <p className="text-xs text-rs-on-surface-variant">Loading addresses...</p>
              ) : addresses.length === 0 ? (
                <p className="text-xs text-rs-on-surface-variant italic">No saved addresses found.</p>
              ) : (
                addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="flex items-start justify-between rounded-rs border border-rs-outline-variant p-3 bg-rs-surface-low"
                  >
                    <div>
                      <p className="text-sm text-rs-on-surface">{addr.addressLine}</p>
                      <p className="text-xs text-rs-on-surface-variant">Pincode: {addr.pincode}</p>
                      {addr.isDefault && (
                        <span className="mt-1 inline-block rounded bg-rs-primary/10 px-2 py-0.5 text-[10px] font-semibold text-rs-primary">
                          Default
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="text-xs text-rs-error hover:underline ml-2"
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>

            <hr className="border-rs-outline-variant my-4" />

            {/* Add new address */}
            <h3 className="font-display text-sm font-semibold text-rs-on-surface">
              Add New Address
            </h3>
            <form onSubmit={handleAddAddress} className="mt-3 space-y-3">
              <Input
                label="Address Line"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                required
                placeholder="Flat/House No, Building, Street"
              />
              <Input
                label="Pincode"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                required
                maxLength={6}
                placeholder="6-digit pincode"
              />
              <label className="flex items-center gap-2 text-xs text-rs-on-surface">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded border-rs-outline"
                />
                Set as default shipping address
              </label>

              {addressError && <p className="text-sm text-rs-error">{addressError}</p>}
              {addressSuccess && <p className="text-sm text-rs-secondary">{addressSuccess}</p>}

              <Button type="submit" fullWidth disabled={addressBusy} size="sm">
                {addressBusy ? 'Adding...' : 'Add Address'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </Container>
  );
}

'use client';

import { useState } from 'react';
import { Button, Input } from '@royal-spirits/ui';
import { useCustomerAuth } from '../lib/auth';

export function OtpLoginModal({ onClose }: { onClose: () => void }) {
  const { sendOtp, verifyOtp } = useCustomerAuth();
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSend() {
    setError('');
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    setBusy(true);
    try {
      await sendOtp(phone);
      setStep('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify() {
    setError('');
    setBusy(true);
    try {
      await verifyOtp(phone, code, name || undefined);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-rs-lg bg-rs-surface-lowest p-6 shadow-ambient">
        {step === 'phone' ? (
          <>
            <h2 className="font-display text-xl font-semibold text-rs-on-surface">
              Sign in to checkout
            </h2>
            <p className="mt-1 text-sm text-rs-on-surface-variant">
              Enter your phone number to receive a verification code.
            </p>
            <div className="mt-4 space-y-3">
              <Input
                label="Name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                label="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile"
                maxLength={10}
              />
              {error && <p className="text-sm text-rs-error">{error}</p>}
              <div className="flex gap-2">
                <Button variant="ghost" fullWidth onClick={onClose}>
                  Cancel
                </Button>
                <Button fullWidth onClick={handleSend} disabled={busy}>
                  {busy ? 'Sending...' : 'Send OTP'}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <h2 className="font-display text-xl font-semibold text-rs-on-surface">
              Enter verification code
            </h2>
            <p className="mt-1 text-sm text-rs-on-surface-variant">
              A 6-digit code was logged to the server console (dev mode). Enter it below.
            </p>
            <div className="mt-4 space-y-3">
              <Input
                label="OTP code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="6-digit code"
                maxLength={6}
              />
              {error && <p className="text-sm text-rs-error">{error}</p>}
              <Button fullWidth onClick={handleVerify} disabled={busy}>
                {busy ? 'Verifying...' : 'Verify & Sign In'}
              </Button>
              <button
                onClick={() => setStep('phone')}
                className="w-full text-center text-xs text-rs-on-surface-variant hover:underline"
              >
                ← Change phone number
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

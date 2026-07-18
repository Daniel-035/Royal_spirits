'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '@royal-spirits/ui';

const STORAGE_KEY = 'rs_age_confirmed';

export function AgeGate({ children }: { children: ReactNode }) {
  const [confirmed, setConfirmed] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const value = localStorage.getItem(STORAGE_KEY);
    if (value !== 'true') {
      setConfirmed(false);
    }
  }, []);

  function handleYes() {
    localStorage.setItem(STORAGE_KEY, 'true');
    setConfirmed(true);
  }

  function handleNo() {
    setBlocked(true);
  }

  if (!mounted) {
    return null;
  }

  if (confirmed) {
    return <>{children}</>;
  }

  if (blocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-rs-surface px-6">
        <div className="max-w-md text-center">
          <h1 className="font-display text-3xl font-bold text-rs-on-surface">
            Access Denied
          </h1>
          <p className="mt-4 text-rs-on-surface-variant">
            You must be 21 years of age or older to access Royal Spirits. Please
            return when you meet the legal drinking age.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-rs-surface px-6">
      <div className="w-full max-w-md rounded-rs-lg border border-rs-outline-variant bg-rs-surface-lowest p-10 shadow-ambient">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-rs-on-surface">
            Royal Spirits
          </h1>
          <p className="mt-2 text-xs uppercase tracking-wide text-rs-on-surface-variant">
            Premium Liquor, Delivered
          </p>
        </div>
        <h2 className="mt-8 text-center font-display text-2xl font-semibold text-rs-on-surface">
          Are you 21 or older?
        </h2>
        <p className="mt-2 text-center text-sm text-rs-on-surface-variant">
          This website sells alcohol and is intended for customers of legal
          drinking age only.
        </p>
        <div className="mt-8 flex gap-3">
          <Button variant="ghost" fullWidth onClick={handleNo}>
            No
          </Button>
          <Button variant="primary" fullWidth onClick={handleYes}>
            Yes, I'm 21+
          </Button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Button, Input } from '@royal-spirits/ui';
import { useCustomerAuth } from '../lib/auth';

export function AuthModal({ onClose }: { onClose: () => void }) {
  const { login, signup } = useCustomerAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    
    if (mode === 'login') {
      if (!email || !password) {
        setError('Please enter both email and password.');
        return;
      }
      setBusy(true);
      try {
        await login(email, password);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Login failed');
      } finally {
        setBusy(false);
      }
    } else {
      if (!email || !password || !phone || !name) {
        setError('All fields are required.');
        return;
      }
      if (!/^[6-9]\d{9}$/.test(phone)) {
        setError('Please enter a valid 10-digit mobile number.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      setBusy(true);
      try {
        await signup(email, password, phone, name);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Registration failed');
      } finally {
        setBusy(false);
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-rs-lg bg-rs-surface-lowest p-6 shadow-ambient">
        <h2 className="font-display text-xl font-semibold text-rs-on-surface">
          {mode === 'login' ? 'Sign In' : 'Register'}
        </h2>
        <p className="mt-1 text-sm text-rs-on-surface-variant">
          {mode === 'login'
            ? 'Access your account to place your order.'
            : 'Enter your details to register.'}
        </p>
        
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {mode === 'signup' && (
            <>
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
                placeholder="10-digit mobile"
                maxLength={10}
              />
            </>
          )}
          
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
          
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="ghost" fullWidth onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" fullWidth disabled={busy}>
              {busy ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Register'}
            </Button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login');
              setError('');
            }}
            className="text-xs text-rs-secondary hover:underline"
          >
            {mode === 'login'
              ? "Don't have an account? Register"
              : 'Already have an account? Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}

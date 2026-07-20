import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Input, Container } from '@royal-spirits/ui';
import { useAuth } from '../lib/auth';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [phone, setPhone] = useState('');
  
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (username.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (!businessName || !licenseNumber || !shopAddress || !phone) {
      setError('All fields are required.');
      return;
    }

    setSubmitting(true);
    try {
      await register({ username, password, businessName, licenseNumber, shopAddress, phone });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-rs-surface py-10">
      <Container className="max-w-md">
        <div className="rounded-rs-lg border border-rs-outline-variant bg-rs-surface-lowest p-8 shadow-ambient">
          <h1 className="font-display text-2xl font-bold text-rs-on-surface">Royal Spirits</h1>
          <p className="mt-1 text-sm text-rs-on-surface-variant">Admin Registration</p>
          
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <Input
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="At least 3 characters"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="At least 6 characters"
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
              label="Shop Address"
              value={shopAddress}
              onChange={(e) => setShopAddress(e.target.value)}
              required
              placeholder="Full shop address"
            />
            <Input
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="Shop phone number"
            />
            
            {error && <p className="text-sm text-rs-error">{error}</p>}
            
            <Button type="submit" fullWidth disabled={submitting}>
              {submitting ? 'Registering...' : 'Register'}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-rs-on-surface-variant">
            Already have an account?{' '}
            <Link to="/login" className="text-rs-secondary font-semibold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}

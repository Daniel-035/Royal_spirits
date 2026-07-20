import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Button } from '@royal-spirits/ui';
import { useAuth } from '../lib/auth';

const NAV = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/products', label: 'Products' },
  { to: '/orders', label: 'Orders' },
  { to: '/conversations', label: 'WhatsApp' },
  { to: '/zones', label: 'Delivery Zones' },
  { to: '/profile', label: 'My Profile' },
];

export function AdminLayout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="flex min-h-screen bg-rs-surface">
      <aside className="flex w-60 flex-col border-r border-rs-outline-variant bg-rs-surface-low">
        <div className="px-5 py-5">
          <span className="font-display text-lg font-bold text-rs-on-surface">Royal Spirits</span>
          <p className="text-xs text-rs-on-surface-variant">Admin Panel</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  'rounded-rs px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-rs-primary text-rs-on-primary'
                    : 'text-rs-on-surface-variant hover:bg-rs-surface-container',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-rs-outline-variant px-5 py-4">
          {admin && (
            <p className="mb-2 text-xs text-rs-on-surface-variant">Signed in as {admin.username}</p>
          )}
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}

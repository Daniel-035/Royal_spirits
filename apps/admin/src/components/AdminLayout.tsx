import { useState, useEffect } from 'react';
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
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1024) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="flex min-h-screen bg-rs-surface">
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-rs-outline-variant bg-rs-surface-low transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          isOpen ? 'lg:static lg:translate-x-0' : 'lg:fixed lg:-translate-x-full',
        ].join(' ')}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-rs-outline-variant">
          <div>
            <span className="font-display text-lg font-bold text-rs-on-surface">Royal Spirits</span>
            <p className="text-xs text-rs-on-surface-variant">Admin Panel</p>
          </div>
          <button
            className="rounded p-1 text-rs-on-surface-variant hover:bg-rs-surface-container hover:text-rs-on-surface"
            onClick={() => setIsOpen(false)}
            title="Collapse Sidebar"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3 mt-4">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setIsOpen(false);
                }
              }}
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
          <Button variant="ghost" size="sm" onClick={handleLogout} fullWidth>
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex h-14 items-center justify-between border-b border-rs-outline-variant bg-rs-surface-lowest px-6 shrink-0">
          <div className="flex items-center gap-3">
            {!isOpen && (
              <button
                className="rounded p-2 text-rs-on-surface hover:bg-rs-surface-container"
                onClick={() => setIsOpen(true)}
                title="Open Sidebar"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            <span className="font-display font-semibold text-rs-on-surface">Royal Spirits Admin</span>
          </div>
          {admin && (
            <div className="text-sm text-rs-on-surface-variant hidden sm:block">
              Signed in as <span className="font-semibold text-rs-on-surface">{admin.username}</span>
            </div>
          )}
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

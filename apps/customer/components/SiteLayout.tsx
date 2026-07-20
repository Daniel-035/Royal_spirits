'use client';

import Link from 'next/link';
import { useCart } from '../lib/cart';
import { CustomerAuthProvider, useCustomerAuth } from '../lib/auth';
import { Container } from '@royal-spirits/ui';
import type { ReactNode } from 'react';

const LICENSE = process.env.NEXT_PUBLIC_EXCISE_LICENSE_NUMBER ?? 'L-EXCISE-00000';

export function SiteHeader() {
  const count = useCart((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const { customer, logout } = useCustomerAuth();

  return (
    <header className="border-b border-rs-outline-variant bg-rs-surface-lowest">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="font-display text-xl font-bold text-rs-on-surface">
          Royal Spirits
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/products" className="text-rs-on-surface-variant hover:text-rs-on-surface">
            Products
          </Link>
          <Link href="/orders" className="text-rs-on-surface-variant hover:text-rs-on-surface">
            My Orders
          </Link>
          <Link
            href="/cart"
            className="relative text-rs-on-surface-variant hover:text-rs-on-surface"
          >
            Cart
            {count > 0 && (
              <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-rs-full bg-rs-secondary text-xs text-rs-on-secondary">
                {count}
              </span>
            )}
          </Link>
          {customer ? (
            <>
              <Link href="/profile" className="text-rs-on-surface-variant hover:text-rs-on-surface">
                Profile
              </Link>
              <button
                onClick={() => logout()}
                className="text-rs-on-surface-variant hover:text-rs-error font-medium"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link href="/login" className="text-rs-on-surface font-semibold hover:underline">
              Sign In
            </Link>
          )}
        </nav>
      </Container>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-rs-outline-variant py-4">
      <Container className="flex flex-col items-center justify-between gap-2 text-xs text-rs-on-surface-variant sm:flex-row">
        <span>Royal Spirits — 21+ only. Drink responsibly.</span>
        <span>Excise License: {LICENSE}</span>
      </Container>
    </footer>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <CustomerAuthProvider>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
    </CustomerAuthProvider>
  );
}

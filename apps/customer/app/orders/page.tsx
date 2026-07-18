'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Container, StatusChip } from '@royal-spirits/ui';
import { api } from '../../lib/api';
import { useCustomerAuth } from '../../lib/auth';
import { OtpLoginModal } from '../../components/OtpLoginModal';
import type { Order } from '@royal-spirits/shared';

export default function MyOrdersPage() {
  const { customer, loading: authLoading } = useCustomerAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOtp, setShowOtp] = useState(false);

  useEffect(() => {
    if (!customer) {
      setLoading(false);
      return;
    }
    api
      .get<Order[]>('/orders/my')
      .then((o) => setOrders(o as Order[]))
      .finally(() => setLoading(false));
  }, [customer]);

  if (authLoading) {
    return (
      <Container className="py-10">
        <p className="text-rs-on-surface-variant">Loading...</p>
      </Container>
    );
  }

  if (!customer) {
    return (
      <Container className="py-10">
        <h1 className="font-display text-3xl font-bold text-rs-on-surface">My Orders</h1>
        <p className="mt-4 text-rs-on-surface-variant">
          Sign in to view your order history.
        </p>
        <button
          onClick={() => setShowOtp(true)}
          className="mt-4 inline-flex h-11 items-center rounded-rs bg-rs-primary px-6 text-base text-rs-on-primary hover:opacity-90"
        >
          Sign in with OTP
        </button>
        {showOtp && <OtpLoginModal onClose={() => setShowOtp(false)} />}
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <h1 className="font-display text-3xl font-bold text-rs-on-surface">My Orders</h1>
      {loading ? (
        <p className="mt-6 text-rs-on-surface-variant">Loading...</p>
      ) : orders.length === 0 ? (
        <p className="mt-6 text-rs-on-surface-variant">You have no orders yet.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block rounded-rs-lg border border-rs-outline-variant bg-rs-surface-lowest p-4 transition-colors hover:border-rs-secondary"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-sm text-rs-on-surface">{order.id.slice(0, 8)}</p>
                  <p className="text-xs text-rs-on-surface-variant">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <StatusChip status={order.status} />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-rs-on-surface-variant">
                  {order.items?.length ?? 0} item(s) · {order.paymentType}
                </span>
                <span className="font-semibold text-rs-on-surface">
                  ₹{order.totalAmount.toFixed(0)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Container>
  );
}

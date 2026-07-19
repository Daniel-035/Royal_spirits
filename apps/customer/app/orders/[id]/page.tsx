'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Container, StatusChip } from '@royal-spirits/ui';
import { api } from '../../../lib/api';
import type { Order } from '@royal-spirits/shared';

export default function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api
      .get<Order>(`/orders/${id}`)
      .then((o) => setOrder(o as Order))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Container className="py-10">
        <p className="text-rs-on-surface-variant">Loading...</p>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container className="py-10">
        <h1 className="font-display text-2xl font-bold text-rs-on-surface">Order not found</h1>
        <Link href="/products" className="mt-4 inline-block text-rs-secondary hover:underline">
          Browse products
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-10">
      <div className="rounded-rs-lg border border-rs-outline-variant bg-rs-surface-lowest p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-rs-full bg-rs-status-delivered text-rs-on-surface">
            ✓
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold text-rs-on-surface">Order Placed!</h1>
            <StatusChip status={order.status} />
          </div>
        </div>
        <p className="mt-4 text-sm text-rs-on-surface-variant">
          Order ID: <span className="font-mono text-rs-on-surface">{order.id}</span>
        </p>
        <p className="mt-1 text-sm text-rs-on-surface-variant">
          Payment: {order.paymentType} · {order.paymentStatus}
          {order.paidAt && (
            <span className="ml-1">
              (paid {new Date(order.paidAt).toLocaleString()})
            </span>
          )}
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-rs border border-rs-outline-variant bg-rs-surface-container p-3 text-sm">
            <p className="text-xs uppercase tracking-wide text-rs-on-surface-variant">
              Estimated delivery
            </p>
            <p className="mt-1 font-medium text-rs-on-surface">
              {order.estimatedDeliveryAt
                ? new Date(order.estimatedDeliveryAt).toLocaleString()
                : 'Not available'}
            </p>
          </div>
          <div className="rounded-rs border border-rs-outline-variant bg-rs-surface-container p-3 text-sm">
            <p className="text-xs uppercase tracking-wide text-rs-on-surface-variant">
              Actual delivery
            </p>
            <p className="mt-1 font-medium text-rs-on-surface">
              {order.deliveredAt
                ? new Date(order.deliveredAt).toLocaleString()
                : order.status === 'Cancelled'
                  ? 'Cancelled'
                  : 'Pending'}
            </p>
          </div>
        </div>

        <h2 className="mt-6 font-display text-lg font-semibold text-rs-on-surface">Items</h2>
        <div className="mt-2 space-y-2">
          {order.items?.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-rs-on-surface-variant">
                {item.itemName} × {item.quantity}
              </span>
              <span className="text-rs-on-surface">₹{(item.unitPrice * item.quantity).toFixed(0)}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-rs-outline-variant pt-4 text-sm">
          <div className="flex justify-between font-semibold">
            <span className="text-rs-on-surface">Total</span>
            <span className="text-rs-on-surface">₹{order.totalAmount.toFixed(0)}</span>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Link
            href="/orders"
            className="inline-flex h-11 items-center rounded-rs border border-rs-primary px-5 text-base text-rs-primary hover:bg-rs-surface-container"
          >
            View My Orders
          </Link>
          <Link
            href="/products"
            className="inline-flex h-11 items-center rounded-rs bg-rs-primary px-5 text-base text-rs-on-primary hover:opacity-90"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </Container>
  );
}

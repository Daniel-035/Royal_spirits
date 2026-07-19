import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Button, StatusChip } from '@royal-spirits/ui';
import { api } from '../lib/api';
import type { Order, OrderStatus } from '@royal-spirits/shared';
import { ORDER_STATUSES, allowedStatusTransitions } from '@royal-spirits/shared';

export function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .get<Order>(`/admin/orders/${id}`)
      .then(setOrder)
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id]);

  async function updateStatus(newStatus: OrderStatus) {
    if (!order) return;
    setError('');
    try {
      const updated = await api.patch<Order>(`/admin/orders/${order.id}/status`, { status: newStatus });
      setOrder(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  }

  async function togglePaymentStatus() {
    if (!order) return;
    setError('');
    const next = order.paymentStatus === 'Paid' ? 'Unpaid' : 'Paid';
    try {
      const updated = await api.patch<Order>(`/admin/orders/${order.id}/payment-status`, {
        paymentStatus: next,
      });
      setOrder(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update payment status');
    }
  }

  async function copyDeliveryDetails() {
    if (!order) return;
    const details = [
      `Customer: ${order.customerName}`,
      `Phone: ${order.phone}`,
      `Address: ${order.deliveryAddress}`,
      `Pincode: ${order.pincode}`,
      `Order #: ${order.id.slice(0, 8)}`,
      `Total: ₹${order.totalAmount.toFixed(0)} (${order.paymentType} - ${order.paymentStatus})`,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(details);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy to clipboard');
    }
  }

  if (loading) {
    return (
      <Container className="py-8">
        <p className="text-rs-on-surface-variant">Loading...</p>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container className="py-8">
        <h1 className="font-display text-2xl font-bold text-rs-on-surface">Order not found</h1>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/orders')}>Back to orders</Button>
      </Container>
    );
  }

  const allowed = allowedStatusTransitions[order.status] ?? [];
  const isTerminal = order.status === 'Delivered' || order.status === 'Cancelled';

  return (
    <Container className="py-8">
      <button onClick={() => navigate('/orders')} className="text-sm text-rs-on-surface-variant hover:text-rs-on-surface">
        ← Back to orders
      </button>
      <div className="mt-4 flex items-center gap-4">
        <h1 className="font-display text-2xl font-bold text-rs-on-surface">
          Order #{order.id.slice(0, 8)}
        </h1>
        <StatusChip status={order.status} />
        <span className={`inline-block rounded-rs-full px-2 py-0.5 text-xs font-medium ${order.source === 'WHATSAPP' ? 'bg-rs-secondary-fixed text-rs-on-secondary-container' : 'bg-rs-surface-container-high text-rs-on-surface-variant'}`}>
          {order.source}
        </span>
      </div>
      <p className="mt-1 text-sm text-rs-on-surface-variant">
        {new Date(order.createdAt).toLocaleString()}
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-rs-lg border border-rs-outline-variant bg-rs-surface-lowest p-6">
            <h2 className="font-display text-lg font-semibold text-rs-on-surface">Order Items</h2>
            <div className="mt-3 space-y-2">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b border-rs-outline-variant pb-2 last:border-0">
                  <div className="flex items-center gap-3">
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt={item.itemName} className="h-10 w-10 rounded-rs object-cover" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-rs-on-surface">{item.itemName}</p>
                      <p className="text-xs text-rs-on-surface-variant">₹{item.unitPrice.toFixed(0)} × {item.quantity}</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-rs-on-surface">
                    ₹{(item.unitPrice * item.quantity).toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-1 border-t border-rs-outline-variant pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-rs-on-surface-variant">Subtotal</span>
                <span className="text-rs-on-surface">₹{order.subtotal.toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-rs-on-surface-variant">Delivery</span>
                <span className="text-rs-on-surface">₹{order.deliveryCharge.toFixed(0)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-rs-on-surface">Total</span>
                <span className="text-rs-on-surface">₹{order.totalAmount.toFixed(0)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-rs-lg border border-rs-outline-variant bg-rs-surface-lowest p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-rs-on-surface">Customer & Delivery Details</h2>
              <Button variant="ghost" size="sm" onClick={copyDeliveryDetails}>
                {copied ? 'Copied!' : 'Copy Details'}
              </Button>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-rs-on-surface-variant">Customer Name</p>
                <p className="mt-1 text-sm font-medium text-rs-on-surface">{order.customerName}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-rs-on-surface-variant">Phone Number</p>
                <p className="mt-1 text-sm text-rs-on-surface">
                  <a href={`tel:${order.phone}`} className="hover:underline">{order.phone}</a>
                </p>
              </div>
            </div>
            <div className="mt-4 border-t border-rs-outline-variant pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-rs-on-surface-variant">Shipping Address</p>
              <p className="mt-1 whitespace-pre-line text-sm text-rs-on-surface">{order.deliveryAddress}</p>
              <p className="mt-2 text-sm text-rs-on-surface-variant">Pincode: <span className="font-medium text-rs-on-surface">{order.pincode}</span></p>
            </div>
      <div className="mt-4 grid gap-4 border-t border-rs-outline-variant pt-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-rs-on-surface-variant">Order Source</p>
          <p className="mt-1 text-sm text-rs-on-surface">{order.source}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-rs-on-surface-variant">Order Date</p>
          <p className="mt-1 text-sm text-rs-on-surface">{new Date(order.createdAt).toLocaleString()}</p>
        </div>
        {order.estimatedDeliveryAt && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-rs-on-surface-variant">Est. Delivery</p>
            <p className="mt-1 text-sm text-rs-on-surface">
              {new Date(order.estimatedDeliveryAt).toLocaleString()}
            </p>
          </div>
        )}
        {order.deliveredAt && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-rs-on-surface-variant">Delivered At</p>
            <p className="mt-1 text-sm text-rs-status-delivered">
              {new Date(order.deliveredAt).toLocaleString()}
            </p>
          </div>
        )}
        {order.paidAt && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-rs-on-surface-variant">Paid At</p>
            <p className="mt-1 text-sm text-rs-on-surface">
              {new Date(order.paidAt).toLocaleString()}
            </p>
          </div>
        )}
      </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-rs-lg border border-rs-outline-variant bg-rs-surface-lowest p-6">
            <h2 className="font-display text-lg font-semibold text-rs-on-surface">Payment</h2>
            <p className="mt-2 text-sm text-rs-on-surface-variant">Type: {order.paymentType}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm text-rs-on-surface-variant">Status:</span>
              <StatusChip status={order.paymentStatus} />
            </div>
            {order.paidAt && (
              <p className="mt-2 text-xs text-rs-on-surface-variant">
                Paid at {new Date(order.paidAt).toLocaleString()}
              </p>
            )}
            {order.paymentType === 'Cash' &&
              order.status !== 'Delivered' &&
              order.paymentStatus === 'Unpaid' && (
                <p className="mt-2 text-xs text-rs-on-surface-variant">
                  Cash orders are collected on delivery. Mark as Delivered to auto-confirm payment.
                </p>
              )}
            <Button
              variant={order.paymentStatus === 'Unpaid' ? 'primary' : 'ghost'}
              size="sm"
              className="mt-3"
              onClick={togglePaymentStatus}
              disabled={
                order.paymentStatus === 'Unpaid' &&
                order.paymentType === 'Cash' &&
                order.status !== 'Delivered'
              }
            >
              Mark as {order.paymentStatus === 'Paid' ? 'Unpaid' : 'Paid'}
            </Button>
          </div>

          <div className="rounded-rs-lg border border-rs-outline-variant bg-rs-surface-lowest p-6">
            <h2 className="font-display text-lg font-semibold text-rs-on-surface">Update Status</h2>
            <p className="mt-1 text-xs text-rs-on-surface-variant">Current: {order.status}</p>
            {error && <p className="mt-2 text-sm text-rs-error">{error}</p>}
            {isTerminal ? (
              <p className="mt-3 text-sm text-rs-on-surface-variant">
                This order is {order.status.toLowerCase()} (terminal state).
              </p>
            ) : (
              <div className="mt-3 flex flex-col gap-2">
                {ORDER_STATUSES.filter((s: OrderStatus) => s !== order.status).map((s: OrderStatus) => (
                  <Button
                    key={s}
                    variant={allowed.includes(s) ? 'primary' : 'ghost'}
                    size="sm"
                    disabled={!allowed.includes(s)}
                    onClick={() => updateStatus(s)}
                  >
                    Mark as {s}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
}

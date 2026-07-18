import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, StatusChip } from '@royal-spirits/ui';
import { api } from '../lib/api';
import type { Order, Paginated, OrderStatus, PaymentStatus, PaymentType } from '@royal-spirits/shared';
import { ORDER_STATUSES, PAYMENT_STATUSES, PAYMENT_TYPES } from '@royal-spirits/shared';

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentType, setPaymentType] = useState('');
  const [search, setSearch] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (paymentStatus) params.set('paymentStatus', paymentStatus);
    if (paymentType) params.set('paymentType', paymentType);
    if (search) params.set('search', search);
    if (date) params.set('date', date);
    params.set('pageSize', '100');
    api
      .get<Paginated<Order>>(`/admin/orders?${params.toString()}`)
      .then((res) => setOrders(res.data))
      .finally(() => setLoading(false));
  }, [status, paymentStatus, paymentType, search, date]);

  return (
    <Container className="py-8">
      <h1 className="font-display text-2xl font-bold text-rs-on-surface">Orders</h1>

      <div className="mt-4 flex flex-wrap gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-11 rounded-rs border border-rs-outline-variant bg-rs-surface-lowest px-3 text-sm focus:border-rs-secondary focus:outline-none"
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s: OrderStatus) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={paymentStatus}
          onChange={(e) => setPaymentStatus(e.target.value)}
          className="h-11 rounded-rs border border-rs-outline-variant bg-rs-surface-lowest px-3 text-sm focus:border-rs-secondary focus:outline-none"
        >
          <option value="">All payments</option>
          {PAYMENT_STATUSES.map((s: PaymentStatus) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={paymentType}
          onChange={(e) => setPaymentType(e.target.value)}
          className="h-11 rounded-rs border border-rs-outline-variant bg-rs-surface-lowest px-3 text-sm focus:border-rs-secondary focus:outline-none"
        >
          <option value="">All types</option>
          {PAYMENT_TYPES.map((t: PaymentType) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-11 rounded-rs border border-rs-outline-variant bg-rs-surface-lowest px-3 text-sm focus:border-rs-secondary focus:outline-none"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, phone, order#..."
          className="h-11 flex-1 rounded-rs border border-rs-outline-variant bg-rs-surface-lowest px-3 text-sm focus:border-rs-secondary focus:outline-none"
        />
      </div>

      <div className="mt-4 overflow-x-auto rounded-rs-lg border border-rs-outline-variant bg-rs-surface-lowest">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-rs-outline-variant bg-rs-surface-container text-xs uppercase tracking-wide text-rs-on-surface-variant">
            <tr>
              <th className="px-4 py-3">Order ID</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Pay Status</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-rs-on-surface-variant">Loading...</td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-rs-on-surface-variant">No orders found.</td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="border-b border-rs-outline-variant last:border-0 hover:bg-rs-surface-container">
                  <td className="px-4 py-3">
                    <Link to={`/orders/${o.id}`} className="font-mono text-rs-secondary hover:underline">
                      {o.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-rs-on-surface">{o.customerName}</td>
                  <td className="px-4 py-3 text-rs-on-surface-variant">{o.phone}</td>
                  <td className="px-4 py-3 text-rs-on-surface-variant">{o.paymentType}</td>
                  <td className="px-4 py-3"><StatusChip status={o.paymentStatus} /></td>
                  <td className="px-4 py-3 text-rs-on-surface-variant">{o.items?.length ?? 0}</td>
                  <td className="px-4 py-3 text-rs-on-surface">₹{o.totalAmount.toFixed(0)}</td>
                  <td className="px-4 py-3"><StatusChip status={o.status} /></td>
                  <td className="px-4 py-3 text-rs-on-surface-variant">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Container>
  );
}

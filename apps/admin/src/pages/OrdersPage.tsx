import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, StatusChip } from '@royal-spirits/ui';
import { api, openOrderStream, type OrderStreamPayload } from '../lib/api';
import type { Order, Paginated, OrderStatus, PaymentStatus, PaymentType, OrderSource } from '@royal-spirits/shared';
import { ORDER_STATUSES, PAYMENT_STATUSES, PAYMENT_TYPES, ORDER_SOURCES } from '@royal-spirits/shared';

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentType, setPaymentType] = useState('');
  const [source, setSource] = useState('');
  const [search, setSearch] = useState('');
  const [date, setDate] = useState('');
  const [liveBanner, setLiveBanner] = useState(false);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (paymentStatus) params.set('paymentStatus', paymentStatus);
    if (paymentType) params.set('paymentType', paymentType);
    if (source) params.set('source', source);
    if (search) params.set('search', search);
    if (date) params.set('date', date);
    params.set('pageSize', '100');
    api
      .get<Paginated<Order>>(`/admin/orders?${params.toString()}`)
      .then((res) => setOrders(res.data))
      .finally(() => setLoading(false));
  }, [status, paymentStatus, paymentType, source, search, date]);

  useEffect(() => {
    const close = openOrderStream({
      onNew: () => setLiveBanner(true),
      onUpdate: (o: OrderStreamPayload) => {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === o.id
              ? {
                  ...order,
                  status: o.status as Order['status'],
                  paymentStatus: o.paymentStatus as Order['paymentStatus'],
                }
              : order,
          ),
        );
      },
      onError: () => setLiveBanner(false),
    });
    return close;
  }, []);

  async function markPaid(id: string) {
    try {
      const updated = await api.patch<Order>(`/admin/orders/${id}/payment-status`, {
        paymentStatus: 'Paid',
      });
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to mark as paid');
    }
  }

  return (
    <Container className="py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-rs-on-surface">Orders</h1>
        {liveBanner && (
          <button
            onClick={() => {
              setLiveBanner(false);
              setLoading(true);
              const params = new URLSearchParams();
              if (status) params.set('status', status);
              if (paymentStatus) params.set('paymentStatus', paymentStatus);
              if (paymentType) params.set('paymentType', paymentType);
              if (source) params.set('source', source);
              if (search) params.set('search', search);
              if (date) params.set('date', date);
              params.set('pageSize', '100');
              api
                .get<Paginated<Order>>(`/admin/orders?${params.toString()}`)
                .then((res) => setOrders(res.data))
                .finally(() => setLoading(false));
            }}
            className="rounded-rs-full bg-rs-status-delivered/10 px-3 py-1 text-xs font-medium text-rs-status-delivered"
          >
            New orders — click to refresh
          </button>
        )}
      </div>

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
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="h-11 rounded-rs border border-rs-outline-variant bg-rs-surface-lowest px-3 text-sm focus:border-rs-secondary focus:outline-none"
        >
          <option value="">All sources</option>
          {ORDER_SOURCES.map((s: OrderSource) => (
            <option key={s} value={s}>{s}</option>
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
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Pay Status</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-rs-on-surface-variant">Loading...</td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-rs-on-surface-variant">No orders found.</td>
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
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-rs-full px-2 py-0.5 text-xs font-medium ${o.source === 'WHATSAPP' ? 'bg-rs-secondary-fixed text-rs-on-secondary-container' : 'bg-rs-surface-container-high text-rs-on-surface-variant'}`}>
                      {o.source}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-rs-on-surface-variant">{o.paymentType}</td>
                  <td className="px-4 py-3"><StatusChip status={o.paymentStatus} /></td>
                  <td className="px-4 py-3 text-rs-on-surface-variant">{o.items?.length ?? 0}</td>
                  <td className="px-4 py-3 text-rs-on-surface">₹{o.totalAmount.toFixed(0)}</td>
                  <td className="px-4 py-3"><StatusChip status={o.status} /></td>
                  <td className="px-4 py-3 text-rs-on-surface-variant">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {o.paymentStatus === 'Unpaid' && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          markPaid(o.id);
                        }}
                        disabled={o.paymentType === 'Cash' && o.status !== 'Delivered'}
                        title={
                          o.paymentType === 'Cash' && o.status !== 'Delivered'
                            ? 'Cash orders are collected on delivery'
                            : 'Mark as Paid'
                        }
                        className="rounded-rs border border-rs-secondary px-3 py-1 text-xs font-medium text-rs-secondary transition-colors hover:bg-rs-secondary-fixed disabled:cursor-not-allowed disabled:border-rs-outline-variant disabled:text-rs-on-surface-variant disabled:opacity-50"
                      >
                        Mark Paid
                      </button>
                    )}
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

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, StatusChip } from '@royal-spirits/ui';
import { api, openOrderStream, type OrderStreamPayload } from '../lib/api';
import type { Order } from '@royal-spirits/shared';

interface DashboardSummary {
  todaysOrders: number;
  pendingOrders: number;
  revenue: number;
  recentOrders: (Order & { customer: { phone: string; name: string | null } })[];
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString();
}

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveFeed, setLiveFeed] = useState<OrderStreamPayload[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    api.get<DashboardSummary>('/admin/dashboard/summary').then(setSummary).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const close = openOrderStream({
      onNew: (order) => {
        setConnected(true);
        setLiveFeed((prev) => {
          if (prev.some((o) => o.id === order.id)) return prev;
          return [order, ...prev].slice(0, 20);
        });
      },
      onUpdate: (order) => {
        setConnected(true);
        setLiveFeed((prev) => {
          const exists = prev.some((o) => o.id === order.id);
          if (!exists) {
            return [order, ...prev].slice(0, 20);
          }
          return prev.map((o) => (o.id === order.id ? order : o));
        });
      },
      onError: () => setConnected(false),
    });
    return close;
  }, []);

  if (loading || !summary) {
    return (
      <Container className="py-8">
        <p className="text-rs-on-surface-variant">Loading...</p>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-rs-on-surface">Dashboard</h1>
        <span
          className={`inline-flex items-center gap-2 rounded-rs-full px-3 py-1 text-xs font-medium ${
            connected
              ? 'bg-rs-status-delivered/10 text-rs-status-delivered'
              : 'bg-rs-surface-container-high text-rs-on-surface-variant'
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${connected ? 'bg-rs-status-delivered' : 'bg-rs-on-surface-variant'}`}
          />
          {connected ? 'Live' : 'Connecting...'}
        </span>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-rs-lg border border-rs-outline-variant bg-rs-surface-lowest p-6">
          <p className="text-xs uppercase tracking-wide text-rs-on-surface-variant">Today's Orders</p>
          <p className="mt-2 font-display text-3xl font-bold text-rs-on-surface">
            {summary.todaysOrders}
          </p>
        </div>
        <div className="rounded-rs-lg border border-rs-outline-variant bg-rs-surface-lowest p-6">
          <p className="text-xs uppercase tracking-wide text-rs-on-surface-variant">Pending</p>
          <p className="mt-2 font-display text-3xl font-bold text-rs-on-surface">
            {summary.pendingOrders}
          </p>
        </div>
        <div className="rounded-rs-lg border border-rs-outline-variant bg-rs-surface-lowest p-6">
          <p className="text-xs uppercase tracking-wide text-rs-on-surface-variant">Revenue</p>
          <p className="mt-2 font-display text-3xl font-bold text-rs-on-surface">
            ₹{summary.revenue.toFixed(0)}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="font-display text-lg font-semibold text-rs-on-surface">
            Live Incoming Orders
          </h2>
          {liveFeed.length === 0 ? (
            <p className="mt-4 text-sm text-rs-on-surface-variant">
              Waiting for new orders in real time...
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {liveFeed.map((o) => (
                <Link
                  key={o.id}
                  to={`/orders/${o.id}`}
                  className="block rounded-rs-lg border border-rs-outline-variant bg-rs-surface-lowest p-3 transition-colors hover:border-rs-secondary"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono text-sm text-rs-on-surface">{o.id.slice(0, 8)}</p>
                      <p className="text-xs text-rs-on-surface-variant">
                        {o.customerName} · {o.phone}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusChip status={o.paymentStatus} />
                      <StatusChip status={o.status} />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-rs-on-surface-variant">
                      {o.source} · {o.paymentType} · {timeAgo(o.createdAt)}
                    </span>
                    <span className="font-semibold text-rs-on-surface">
                      ₹{o.totalAmount.toFixed(0)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-rs-on-surface">Recent Orders</h2>
          {summary.recentOrders.length === 0 ? (
            <p className="mt-4 text-sm text-rs-on-surface-variant">No orders yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-rs-lg border border-rs-outline-variant bg-rs-surface-lowest">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-rs-outline-variant bg-rs-surface-container text-xs uppercase tracking-wide text-rs-on-surface-variant">
                  <tr>
                    <th className="px-4 py-3">Order ID</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.recentOrders.map((o) => (
                    <tr key={o.id} className="border-b border-rs-outline-variant last:border-0">
                      <td className="px-4 py-3 font-mono text-rs-on-surface">{o.id.slice(0, 8)}</td>
                      <td className="px-4 py-3 text-rs-on-surface-variant">
                        {o.customer.name ?? o.customer.phone}
                      </td>
                      <td className="px-4 py-3"><StatusChip status={o.status} /></td>
                      <td className="px-4 py-3 text-rs-on-surface">₹{o.totalAmount.toFixed(0)}</td>
                      <td className="px-4 py-3 text-rs-on-surface-variant">
                        {new Date(o.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </Container>
  );
}

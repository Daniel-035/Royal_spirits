import { useEffect, useState } from 'react';
import { Container, StatusChip } from '@royal-spirits/ui';
import { api } from '../lib/api';
import type { Order } from '@royal-spirits/shared';

interface DashboardSummary {
  todaysOrders: number;
  pendingOrders: number;
  revenue: number;
  recentOrders: (Order & { customer: { phone: string; name: string | null } })[];
}

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<DashboardSummary>('/admin/dashboard/summary').then(setSummary).finally(() => setLoading(false));
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
      <h1 className="font-display text-2xl font-bold text-rs-on-surface">Dashboard</h1>
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

      <h2 className="mt-8 font-display text-lg font-semibold text-rs-on-surface">Recent Orders</h2>
      {summary.recentOrders.length === 0 ? (
        <p className="mt-4 text-rs-on-surface-variant">No orders yet.</p>
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
    </Container>
  );
}

import { useEffect, useState } from 'react';
import { Container, Button, Input } from '@royal-spirits/ui';
import { api } from '../lib/api';
import type { Zone } from '@royal-spirits/shared';

const EMPTY = {
  pincode: '',
  deliveryStartTime: '10:00',
  deliveryEndTime: '21:00',
  deliveryWindowMins: 90,
};

export function ZonesPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ...EMPTY });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    api.get<Zone[]>('/admin/zones').then(setZones).finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await api.put(`/admin/zones/${editingId}`, form);
      } else {
        await api.post('/admin/zones', { ...form, isActive: true });
      }
      setForm({ ...EMPTY });
      setEditingId(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save zone');
    }
  }

  function startEdit(zone: Zone) {
    setEditingId(zone.id);
    setForm({
      pincode: zone.pincode,
      deliveryStartTime: zone.deliveryStartTime,
      deliveryEndTime: zone.deliveryEndTime,
      deliveryWindowMins: zone.deliveryWindowMins,
    });
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this serviceable pincode?')) return;
    await api.delete(`/admin/zones/${id}`);
    load();
  }

  async function toggleActive(zone: Zone) {
    await api.put(`/admin/zones/${zone.id}`, { isActive: !zone.isActive });
    load();
  }

  return (
    <Container className="py-8">
      <h1 className="font-display text-2xl font-bold text-rs-on-surface">Delivery Zones</h1>
      <p className="mt-2 text-sm text-rs-on-surface-variant">
        Only serviceable pincodes can accept orders. Changes apply immediately.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 flex flex-wrap items-end gap-3 rounded-rs-lg border border-rs-outline-variant bg-rs-surface-lowest p-4"
      >
        <Input
          label="Pincode"
          value={form.pincode}
          onChange={(e) => setForm({ ...form, pincode: e.target.value })}
          pattern="\d{6}"
          maxLength={6}
          required
        />
        <Input
          label="Delivery start (24h)"
          type="time"
          value={form.deliveryStartTime}
          onChange={(e) => setForm({ ...form, deliveryStartTime: e.target.value })}
          required
        />
        <Input
          label="Delivery end (24h)"
          type="time"
          value={form.deliveryEndTime}
          onChange={(e) => setForm({ ...form, deliveryEndTime: e.target.value })}
          required
        />
        <Input
          label="ETA window (mins)"
          type="number"
          min={1}
          max={600}
          value={form.deliveryWindowMins}
          onChange={(e) =>
            setForm({ ...form, deliveryWindowMins: Number(e.target.value) })
          }
          required
        />
        <Button type="submit">{editingId ? 'Update Zone' : 'Add Zone'}</Button>
        {editingId && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setEditingId(null);
              setForm({ ...EMPTY });
            }}
          >
            Cancel
          </Button>
        )}
      </form>
      {error && <p className="mt-2 text-sm text-rs-error">{error}</p>}

      <div className="mt-6 overflow-x-auto rounded-rs-lg border border-rs-outline-variant bg-rs-surface-lowest">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-rs-outline-variant bg-rs-surface-container text-xs uppercase tracking-wide text-rs-on-surface-variant">
            <tr>
              <th className="px-4 py-3">Pincode</th>
              <th className="px-4 py-3">Start</th>
              <th className="px-4 py-3">End</th>
              <th className="px-4 py-3">ETA</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-rs-on-surface-variant">
                  Loading...
                </td>
              </tr>
            ) : zones.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-rs-on-surface-variant">
                  No zones configured.
                </td>
              </tr>
            ) : (
              zones.map((z) => (
                <tr key={z.id} className="border-b border-rs-outline-variant last:border-0">
                  <td className="px-4 py-3 font-medium text-rs-on-surface">{z.pincode}</td>
                  <td className="px-4 py-3 text-rs-on-surface-variant">{z.deliveryStartTime}</td>
                  <td className="px-4 py-3 text-rs-on-surface-variant">{z.deliveryEndTime}</td>
                  <td className="px-4 py-3 text-rs-on-surface-variant">{z.deliveryWindowMins}m</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        z.isActive
                          ? 'text-rs-status-delivered text-xs font-medium uppercase'
                          : 'text-rs-danger text-xs font-medium uppercase'
                      }
                    >
                      {z.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => startEdit(z)}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleActive(z)}>
                        {z.isActive ? 'Disable' : 'Enable'}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(z.id)}>
                        Delete
                      </Button>
                    </div>
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

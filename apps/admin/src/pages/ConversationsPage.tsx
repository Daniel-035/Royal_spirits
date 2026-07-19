import { useEffect, useState, useCallback } from 'react';
import { Container, Button } from '@royal-spirits/ui';
import { api } from '../lib/api';

interface ConversationSummary {
  phone: string;
  lastMessageAt: string;
  messageCount: number;
  handoffToAdminId: string | null;
  customerName: string | null;
  state: string | null;
}

interface ConversationMessage {
  id: string;
  direction: string;
  type: string;
  fromPhone: string;
  createdAt: string;
  payload: string;
}

interface ConversationDetail {
  phone: string;
  session: {
    state: string;
    customerName: string | null;
    handoffToAdminId: string | null;
    cartJson: string;
  } | null;
  messages: ConversationMessage[];
}

function extractText(payload: string): string {
  try {
    const obj = JSON.parse(payload);
    if (obj.text?.body) return obj.text.body;
    if (obj.interactive?.list_reply?.title) return `[list] ${obj.interactive.list_reply.title}`;
    if (obj.interactive?.button_reply?.id) return `[button] ${obj.interactive.button_reply.id}`;
    if (obj.message) return obj.message;
    return JSON.stringify(obj).slice(0, 120);
  } catch {
    return payload.slice(0, 120);
  }
}

export function ConversationsPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastAll, setBroadcastAll] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const loadConversations = useCallback(() => {
    setLoading(true);
    api
      .get<{ data: ConversationSummary[] }>('/admin/whatsapp/conversations?pageSize=100')
      .then((res) => setConversations(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const loadDetail = useCallback((phone: string) => {
    setSelectedPhone(phone);
    setDetailLoading(true);
    api
      .get<ConversationDetail>(`/admin/whatsapp/conversations/${phone}?limit=100`)
      .then(setDetail)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setDetailLoading(false));
  }, []);

  async function toggleHandoff(phone: string, enabled: boolean) {
    try {
      await api.post(`/admin/whatsapp/handoff/${phone}`, { enabled: !enabled });
      if (selectedPhone === phone) loadDetail(phone);
      loadConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle handoff');
    }
  }

  async function sendBroadcast(e: React.FormEvent) {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    setSending(true);
    setError('');
    try {
      const body: { message: string; all?: boolean; phones?: string[] } = {
        message: broadcastMessage,
      };
      if (broadcastAll) {
        body.all = true;
      } else {
        body.phones = selectedPhone ? [selectedPhone] : [];
      }
      const result = await api.post<{ sent: number; failed: number }>(
        '/admin/whatsapp/broadcast',
        body,
      );
      setBroadcastMessage('');
      setBroadcastOpen(false);
      setError(`Sent: ${result.sent}, failed: ${result.failed}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Broadcast failed');
    } finally {
      setSending(false);
    }
  }

  return (
    <Container className="py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-rs-on-surface">WhatsApp Conversations</h1>
        <Button variant="secondary" size="sm" onClick={() => setBroadcastOpen((v) => !v)}>
          {broadcastOpen ? 'Close' : 'Broadcast'}
        </Button>
      </div>

      {error && (
        <div className="mt-3 rounded-rs border border-rs-status-cancelled/30 bg-rs-status-cancelled/5 px-3 py-2 text-sm text-rs-status-cancelled">
          {error}
        </div>
      )}

      {broadcastOpen && (
        <form onSubmit={sendBroadcast} className="mt-4 rounded-rs-lg border border-rs-outline-variant bg-rs-surface-lowest p-4">
          <label className="flex items-center gap-2 text-sm text-rs-on-surface-variant">
            <input
              type="checkbox"
              checked={broadcastAll}
              onChange={(e) => setBroadcastAll(e.target.checked)}
            />
            Send to all conversations
          </label>
          {!broadcastAll && (
            <p className="mt-1 text-xs text-rs-on-surface-variant">
              {selectedPhone ? `Recipient: ${selectedPhone}` : 'Select a conversation to send to a single recipient.'}
            </p>
          )}
          <textarea
            value={broadcastMessage}
            onChange={(e) => setBroadcastMessage(e.target.value)}
            placeholder="Message to send..."
            rows={3}
            className="mt-3 w-full rounded-rs border border-rs-outline-variant bg-rs-surface px-3 py-2 text-sm focus:border-rs-secondary focus:outline-none"
          />
          <div className="mt-2 flex justify-end">
            <Button type="submit" variant="primary" size="sm" disabled={sending || !broadcastMessage.trim()}>
              {sending ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </form>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="overflow-x-auto rounded-rs-lg border border-rs-outline-variant bg-rs-surface-lowest">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-rs-outline-variant bg-rs-surface-container text-xs uppercase tracking-wide text-rs-on-surface-variant">
              <tr>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">State</th>
                <th className="px-4 py-3">Msgs</th>
                <th className="px-4 py-3">Handoff</th>
                <th className="px-4 py-3">Last</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-rs-on-surface-variant">Loading...</td></tr>
              ) : conversations.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-rs-on-surface-variant">No conversations yet.</td></tr>
              ) : (
                conversations.map((c) => (
                  <tr
                    key={c.phone}
                    onClick={() => loadDetail(c.phone)}
                    className={`cursor-pointer border-b border-rs-outline-variant last:border-0 hover:bg-rs-surface-container ${selectedPhone === c.phone ? 'bg-rs-surface-container' : ''}`}
                  >
                    <td className="px-4 py-3 font-mono text-rs-on-surface">{c.phone}</td>
                    <td className="px-4 py-3 text-rs-on-surface-variant">{c.customerName ?? '—'}</td>
                    <td className="px-4 py-3 text-rs-on-surface-variant">{c.state ?? '—'}</td>
                    <td className="px-4 py-3 text-rs-on-surface-variant">{c.messageCount}</td>
                    <td className="px-4 py-3">
                      {c.handoffToAdminId ? (
                        <span className="inline-block rounded-rs-full bg-rs-secondary-fixed px-2 py-0.5 text-xs font-medium text-rs-on-secondary-container">Human</span>
                      ) : (
                        <span className="inline-block rounded-rs-full bg-rs-surface-container-high px-2 py-0.5 text-xs font-medium text-rs-on-surface-variant">Bot</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-rs-on-surface-variant">
                      {new Date(c.lastMessageAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-rs-lg border border-rs-outline-variant bg-rs-surface-lowest p-4">
          {!selectedPhone ? (
            <p className="py-8 text-center text-sm text-rs-on-surface-variant">Select a conversation to view messages.</p>
          ) : detailLoading ? (
            <p className="py-8 text-center text-sm text-rs-on-surface-variant">Loading...</p>
          ) : detail ? (
            <div>
              <div className="flex items-center justify-between border-b border-rs-outline-variant pb-3">
                <div>
                  <p className="font-mono text-sm text-rs-on-surface">{detail.phone}</p>
                  <p className="text-xs text-rs-on-surface-variant">
                    {detail.session?.customerName ?? 'Unknown'} · state: {detail.session?.state ?? '—'}
                  </p>
                </div>
                <Button
                  variant={detail.session?.handoffToAdminId ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => toggleHandoff(detail.phone, !!detail.session?.handoffToAdminId)}
                >
                  {detail.session?.handoffToAdminId ? 'Return to bot' : 'Take over'}
                </Button>
              </div>
              <div className="mt-3 max-h-[60vh] space-y-2 overflow-y-auto">
                {detail.messages.length === 0 ? (
                  <p className="py-4 text-center text-sm text-rs-on-surface-variant">No messages logged.</p>
                ) : (
                  detail.messages.map((m) => {
                    const inbound = m.direction === 'in';
                    return (
                      <div
                        key={m.id}
                        className={`flex ${inbound ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-rs px-3 py-2 text-sm ${
                            inbound
                              ? 'bg-rs-surface-container text-rs-on-surface'
                              : 'bg-rs-primary text-rs-on-primary'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{extractText(m.payload)}</p>
                          <p className={`mt-1 text-[10px] ${inbound ? 'text-rs-on-surface-variant' : 'text-rs-on-primary/70'}`}>
                            {new Date(m.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <form
                onSubmit={sendBroadcast}
                className="mt-3 flex gap-2 border-t border-rs-outline-variant pt-3"
              >
                <input
                  type="text"
                  value={broadcastOpen ? broadcastMessage : ''}
                  onChange={(e) => { setBroadcastMessage(e.target.value); setBroadcastOpen(true); setBroadcastAll(false); }}
                  placeholder="Reply to this customer..."
                  className="flex-1 rounded-rs border border-rs-outline-variant bg-rs-surface px-3 py-2 text-sm focus:border-rs-secondary focus:outline-none"
                />
                <Button type="submit" variant="primary" size="sm" disabled={sending || !broadcastMessage.trim()}>
                  Send
                </Button>
              </form>
            </div>
          ) : null}
        </div>
      </div>
    </Container>
  );
}

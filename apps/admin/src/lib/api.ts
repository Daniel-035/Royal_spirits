const API_ORIGIN = import.meta.env.VITE_API_BASE_URL ?? '';
const BASE = `${API_ORIGIN}/api/v1`;

if (!API_ORIGIN && typeof window !== 'undefined') {
  console.error(
    '[api] VITE_API_BASE_URL is not set. Requests will be sent to the ' +
      'current origin instead of the API server. Set VITE_API_BASE_URL ' +
      'in the build environment (e.g. Render/Netlify env vars).',
  );
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    let details: unknown;
    try {
      const body = await res.json();
      message = body?.error?.message ?? message;
      details = body?.error?.details;
    } catch {
      // non-JSON error response
    }
    const error = new Error(message) as Error & {
      status: number;
      details?: unknown;
    };
    error.status = res.status;
    error.details = details;
    throw error;
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export interface OrderStreamHandlers {
  onNew: (order: OrderStreamPayload) => void;
  onUpdate: (order: OrderStreamPayload) => void;
  onError?: (err: Event) => void;
}

export interface OrderStreamPayload {
  id: string;
  status: string;
  paymentStatus: string;
  paymentType: string;
  customerName: string;
  phone: string;
  totalAmount: number;
  source: string;
  createdAt: string;
}

export function openOrderStream(handlers: OrderStreamHandlers): () => void {
  const url = `${BASE}/admin/orders/stream`;
  const source = new EventSource(url, { withCredentials: true });

  source.addEventListener('order:new', (e) => {
    try {
      handlers.onNew(JSON.parse((e as MessageEvent).data) as OrderStreamPayload);
    } catch {
      // ignore malformed event
    }
  });
  source.addEventListener('order:update', (e) => {
    try {
      handlers.onUpdate(JSON.parse((e as MessageEvent).data) as OrderStreamPayload);
    } catch {
      // ignore malformed event
    }
  });
  source.onerror = (e) => {
    handlers.onError?.(e);
  };

  return () => source.close();
}

export async function uploadImage(
  path: string,
  file: File,
): Promise<{ imageUrl: string }> {
  const formData = new FormData();
  formData.append('image', file);
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? 'Upload failed');
  }
  return res.json();
}

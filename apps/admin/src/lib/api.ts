const BASE = '/api/v1';

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

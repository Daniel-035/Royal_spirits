function getBase(): string {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
  }
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  const isDev = apiBase.startsWith('http://localhost') || apiBase.startsWith('http://127.');
  return isDev ? '' : apiBase;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const base = getBase();
  const res = await fetch(`${base}/api/v1${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const body = await res.json();
      message = body?.error?.message ?? message;
    } catch {
      // non-JSON error response
    }
    const error = new Error(message) as Error & { status: number };
    error.status = res.status;
    throw error;
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
};

import { getCurrentUserIdToken } from '@/infrastructure/firebase/auth';

interface ApiEnvelope<T> {
  readonly success?: boolean;
  readonly data?: T;
  readonly error?: string;
}

async function sendAdminRequest<T>(path: string, method: 'GET' | 'PATCH', body?: unknown): Promise<T> {
  const token = await getCurrentUserIdToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: 'Bearer ' + token,
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(path, {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const payload = await response.json().catch(() => null) as ApiEnvelope<T> | null;

  if (!response.ok || !payload?.success || payload.data === undefined) {
    throw new Error(payload?.error ?? 'Admin request failed (HTTP ' + response.status + ')');
  }

  return payload.data;
}

export async function adminGet<T>(path: string): Promise<T> {
  return sendAdminRequest<T>(path, 'GET');
}

export async function adminPatch<T>(path: string, body: unknown): Promise<T> {
  return sendAdminRequest<T>(path, 'PATCH', body);
}

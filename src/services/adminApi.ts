import { getCurrentUserIdToken } from '@/infrastructure/firebase/auth';

interface ApiEnvelope<T> {
  readonly success?: boolean;
  readonly data?: T;
  readonly error?: string;
}

export async function adminGet<T>(path: string): Promise<T> {
  const token = await getCurrentUserIdToken();
  const response = await fetch(path, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  const payload = await response.json().catch(() => null) as ApiEnvelope<T> | null;

  if (!response.ok || !payload?.success || payload.data === undefined) {
    throw new Error(payload?.error ?? `Admin request failed (HTTP ${response.status})`);
  }

  return payload.data;
}

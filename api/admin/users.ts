import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminError, requireAdmin } from '../../server/adminAuthorization.js';

type Role = 'admin' | 'customer';

function timestampToMillis(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value instanceof Date) return value.getTime();
  if (value && typeof value === 'object') {
    const candidate = value as { toMillis?: () => number; seconds?: number; _seconds?: number };
    if (typeof candidate.toMillis === 'function') return candidate.toMillis();
    const seconds = candidate.seconds ?? candidate._seconds;
    if (typeof seconds === 'number' && Number.isFinite(seconds)) return seconds * 1000;
  }
  return 0;
}

function positiveLimit(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = raw ? Number(raw) : 50;
  return Number.isSafeInteger(parsed) ? Math.max(1, Math.min(parsed, 200)) : 50;
}

function jsonError(res: VercelResponse, status: number, error: string) {
  return res.status(status).json({ success: false, error });
}

/** Lists user profiles for the protected admin console. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return jsonError(res, 405, 'Method not allowed');

  try {
    const { firestore } = await requireAdmin(req);
    const roleParam = typeof req.query.role === 'string' ? req.query.role : 'all';
    if (roleParam !== 'all' && roleParam !== 'customer') {
      return jsonError(res, 400, 'role must be all or customer');
    }

    const limit = positiveLimit(req.query.limit);
    const collection = firestore.collection('users');
    const snapshot = roleParam === 'customer'
      ? await collection.where('role', '==', 'customer').limit(limit).get()
      : await collection.limit(limit).get();

    const users = snapshot.docs.map((document) => {
      const data = document.data();
      const role: Role = data.role === 'admin' ? 'admin' : 'customer';
      return {
        uid: document.id,
        email: typeof data.email === 'string' ? data.email : null,
        displayName: typeof data.displayName === 'string' ? data.displayName : null,
        photoURL: typeof data.photoURL === 'string' ? data.photoURL : null,
        role,
        createdAt: timestampToMillis(data.createdAt),
        lastLoginAt: timestampToMillis(data.lastLoginAt),
      };
    }).sort((a, b) => b.createdAt - a.createdAt);

    return res.status(200).json({
      success: true,
      data: { users, count: users.length },
    });
  } catch (error) {
    const { status, message } = getAdminError(error);
    if (status >= 500) console.error('Admin user list request failed:', error instanceof Error ? error.message : 'unknown error');
    return jsonError(res, status, message);
  }
}

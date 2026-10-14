import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminError, requireAdmin } from '../../server/adminAuthorization.js';

interface AuditDocument {
  readonly action?: unknown;
  readonly user?: unknown;
  readonly timestamp?: unknown;
  readonly details?: unknown;
}

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

function textValue(value: unknown, fallback: string): string {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return fallback;
  try {
    return JSON.stringify(value);
  } catch {
    return fallback;
  }
}

function jsonError(res: VercelResponse, status: number, error: string) {
  return res.status(status).json({ success: false, error });
}

/** Returns recent audit events. Only an authenticated admin can read them. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return jsonError(res, 405, 'Method not allowed');

  try {
    const { firestore } = await requireAdmin(req);
    const snapshot = await firestore.collection('auditLogs').orderBy('timestamp', 'desc').limit(50).get();
    const logs = snapshot.docs.map((document) => {
      const data = document.data() as AuditDocument;
      return {
        id: document.id,
        action: textValue(data.action, 'unknown'),
        user: textValue(data.user, 'system'),
        timestamp: timestampToMillis(data.timestamp),
        details: textValue(data.details, ''),
      };
    });

    return res.status(200).json({ success: true, data: { logs, count: logs.length } });
  } catch (error) {
    const { status, message } = getAdminError(error);
    if (status >= 500) console.error('Admin audit log request failed:', error instanceof Error ? error.message : 'unknown error');
    return jsonError(res, status, message);
  }
}

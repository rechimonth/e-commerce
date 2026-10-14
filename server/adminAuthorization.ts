import { getAuth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import type { VercelRequest } from '@vercel/node';
import { FirebaseConfigurationError, getFirebaseAdminApp } from './firebaseAdmin.js';

export class AdminAuthorizationError extends Error {
  constructor(
    readonly status: 401 | 403,
    message: string,
  ) {
    super(message);
    this.name = 'AdminAuthorizationError';
  }
}

export interface AuthorizedAdmin {
  readonly uid: string;
  readonly firestore: Firestore;
}

/**
 * Verifies the Firebase ID token and the current Firestore role server-side.
 * Firebase Admin SDK reads bypass Firestore client rules, so every route using
 * this helper must call it before accessing admin-only data.
 */
export async function requireAdmin(req: Pick<VercelRequest, 'headers'>): Promise<AuthorizedAdmin> {
  const authorization = req.headers.authorization;
  if (typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) {
    throw new AdminAuthorizationError(401, 'Authentication required');
  }

  const token = authorization.slice(7).trim();
  if (!token) throw new AdminAuthorizationError(401, 'Authentication required');

  const app = getFirebaseAdminApp();
  let decoded: { uid: string };
  try {
    decoded = await getAuth(app).verifyIdToken(token);
  } catch {
    throw new AdminAuthorizationError(401, 'Invalid or expired Firebase ID token');
  }

  const firestore = getFirestore(app);
  const profile = await firestore.collection('users').doc(decoded.uid).get();
  if (!profile.exists || profile.data()?.role !== 'admin') {
    throw new AdminAuthorizationError(403, 'Admin role required');
  }

  return { uid: decoded.uid, firestore };
}

export function getAdminError(error: unknown): { status: number; message: string } {
  if (error instanceof AdminAuthorizationError) {
    return { status: error.status, message: error.message };
  }
  if (error instanceof FirebaseConfigurationError) {
    return { status: 500, message: 'Firebase server configuration is incomplete' };
  }
  return { status: 500, message: 'Unable to complete the administrator request' };
}

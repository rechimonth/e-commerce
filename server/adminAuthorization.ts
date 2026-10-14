import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import type { VercelRequest } from '@vercel/node';
import { FirebaseConfigurationError, getFirebaseAdminApp } from './firebaseAdmin.js';
import { FirebaseTokenError, verifyFirebaseIdToken } from './firebaseToken.js';

export class AdminAuthorizationError extends Error {
  constructor(
    readonly status: 401 | 403 | 503,
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
 * Verifies the Firebase ID token and current Firestore role server-side.
 * All admin-only endpoints must call this helper before reading protected data.
 */
export async function requireAdmin(req: Pick<VercelRequest, 'headers'>): Promise<AuthorizedAdmin> {
  const authorization = req.headers.authorization;
  if (typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) {
    throw new AdminAuthorizationError(401, 'Authentication required');
  }
  const token = authorization.slice(7).trim();
  if (!token) throw new AdminAuthorizationError(401, 'Authentication required');

  let decoded: { uid: string };
  try {
    decoded = await verifyFirebaseIdToken(token);
  } catch (error) {
    if (error instanceof FirebaseTokenError) {
      throw new AdminAuthorizationError(error.status, error.message);
    }
    throw error;
  }

  const app = getFirebaseAdminApp();
  const firestore = getFirestore(app);
  const profile = await firestore.collection('users').doc(decoded.uid).get();
  if (!profile.exists || profile.data()?.role !== 'admin') {
    throw new AdminAuthorizationError(403, 'Admin role required');
  }
  return { uid: decoded.uid, firestore };
}

export function getAdminError(error: unknown): { status: number; message: string } {
  if (error instanceof AdminAuthorizationError) return { status: error.status, message: error.message };
  if (error instanceof FirebaseConfigurationError) {
    return { status: 500, message: 'Firebase server configuration is incomplete' };
  }
  return { status: 500, message: 'Unable to complete the administrator request' };
}

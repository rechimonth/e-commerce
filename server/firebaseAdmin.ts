import { cert, getApps, initializeApp } from 'firebase-admin/app';
import type { App } from 'firebase-admin/app';

export class FirebaseConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FirebaseConfigurationError';
  }
}

export function normalizePrivateKey(value: string): string {
  let key = value.trim();
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1).trim();
  }
  return key.replace(/\\r?\\n/g, '\n').replace(/\\n/g, '\n').replace(/\\r/g, '\r').trim();
}

function validatePrivateKey(value: string, source: string): string {
  const privateKey = normalizePrivateKey(value);
  if (!privateKey.includes('-----BEGIN PRIVATE KEY-----') || !privateKey.includes('-----END PRIVATE KEY-----')) {
    throw new FirebaseConfigurationError(`${source} has an invalid private key format`);
  }
  return privateKey;
}

/**
 * One server-only Firebase Admin initializer for all Vercel API functions.
 * Supports the complete service-account JSON or the legacy split variables.
 */
export function getFirebaseAdminApp(): App {
  const existing = getApps();
  if (existing.length > 0) return existing[0]!;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (serviceAccountJson) {
    let credentials: Record<string, unknown>;
    try {
      credentials = JSON.parse(serviceAccountJson) as Record<string, unknown>;
    } catch {
      throw new FirebaseConfigurationError('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON');
    }

    const projectId = typeof credentials.project_id === 'string' ? credentials.project_id : '';
    const clientEmail = typeof credentials.client_email === 'string' ? credentials.client_email : '';
    const keyValue = typeof credentials.private_key === 'string' ? credentials.private_key : '';
    if (!projectId || !clientEmail || !keyValue) {
      throw new FirebaseConfigurationError('FIREBASE_SERVICE_ACCOUNT_JSON is missing required fields');
    }

    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: validatePrivateKey(keyValue, 'FIREBASE_SERVICE_ACCOUNT_JSON'),
      }),
    });
  }

  const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.VITE_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyValue = process.env.FIREBASE_PRIVATE_KEY;
  const missing = [
    !projectId ? 'FIREBASE_PROJECT_ID' : null,
    !clientEmail ? 'FIREBASE_CLIENT_EMAIL' : null,
    !privateKeyValue ? 'FIREBASE_PRIVATE_KEY' : null,
  ].filter((value): value is string => Boolean(value));
  if (missing.length > 0) {
    throw new FirebaseConfigurationError(`Missing Firebase Admin environment variables: ${missing.join(', ')}`);
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: validatePrivateKey(privateKeyValue!, 'FIREBASE_PRIVATE_KEY'),
    }),
  });
}

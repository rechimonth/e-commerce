import { FirebaseConfigurationError } from './firebaseAdmin.js';

export class FirebaseTokenError extends Error {
  constructor(
    readonly status: 401 | 503,
    message: string,
  ) {
    super(message);
    this.name = 'FirebaseTokenError';
  }
}

interface IdentityToolkitLookupResponse {
  readonly users?: readonly { readonly localId?: string; readonly disabled?: boolean }[];
  readonly error?: { readonly message?: string };
}

/**
 * Validate Firebase ID tokens through Identity Toolkit. This avoids the
 * firebase-admin/auth -> jwks-rsa/jose import chain that crashes Vercel
 * functions in this project runtime.
 */
export async function verifyFirebaseIdToken(token: string): Promise<{ uid: string }> {
  const apiKey = process.env.FIREBASE_WEB_API_KEY ?? process.env.VITE_FIREBASE_API_KEY;
  if (!apiKey) {
    throw new FirebaseConfigurationError('FIREBASE_WEB_API_KEY or VITE_FIREBASE_API_KEY is required for token verification');
  }

  let response: Response;
  try {
    response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
      },
    );
  } catch {
    throw new FirebaseTokenError(503, 'Firebase token verification is temporarily unavailable');
  }

  const payload = await response.json().catch(() => null) as IdentityToolkitLookupResponse | null;
  if (!response.ok) {
    const firebaseError = payload?.error?.message ?? '';
    if (['API_KEY_INVALID', 'INVALID_API_KEY', 'PROJECT_NOT_FOUND', 'CONFIGURATION_NOT_FOUND'].includes(firebaseError)) {
      throw new FirebaseConfigurationError('The Firebase Web API key is invalid or does not match this project');
    }
    throw new FirebaseTokenError(401, 'Invalid or expired Firebase ID token');
  }

  const user = payload?.users?.[0];
  if (!user?.localId || user.disabled) {
    throw new FirebaseTokenError(401, 'Invalid or expired Firebase ID token');
  }
  return { uid: user.localId };
}
